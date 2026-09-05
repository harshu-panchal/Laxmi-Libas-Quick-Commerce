import { Server as SocketIOServer } from 'socket.io';
import Delivery from '../models/Delivery';
import Order from '../models/Order';
import Seller from '../models/Seller';
import DeliveryTracking from '../models/DeliveryTracking';
import AppSettings from '../models/AppSettings';
import mongoose from 'mongoose';
import { notifySellersOfOrderUpdate } from './sellerNotificationService';
import fs from 'fs';
import path from 'path';

// Debug logger to file
const logFile = path.join(process.cwd(), 'notification_debug.log');
export function debugLog(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    try {
        fs.appendFileSync(logFile, logMessage);
    } catch (e) {
        // Fallback if file system issue
    }
    console.log(message);
}

/**
 * Calculate estimated delivery boy earning for a new order
 * Uses the same logic as commission distribution but provides an estimate
 * before the order is assigned
 */
export async function calculateEstimatedDeliveryBoyEarning(order: any): Promise<number> {
    try {
        // @ts-ignore - getSettings is a static method
        const settings = await AppSettings.getSettings();

        // Check if distance-based delivery is enabled
        if (
            settings?.deliveryConfig?.isDistanceBased === true &&
            settings.deliveryConfig?.deliveryBoyKmRate &&
            order.deliveryDistanceKm &&
            order.deliveryDistanceKm > 0
        ) {
            // Distance-based calculation
            const earning = order.deliveryDistanceKm * settings.deliveryConfig.deliveryBoyKmRate;
            console.log(`📊 [Earning Calc] Distance-based: ${order.deliveryDistanceKm}km × ₹${settings.deliveryConfig.deliveryBoyKmRate}/km = ₹${earning.toFixed(2)}`);
            return Math.round(earning * 100) / 100;
        }

        // Fallback to percentage-based on subtotal (default 5%)
        // Since we don't know which delivery boy will accept, use default rate
        const defaultCommissionRate = 5;
        const earning = (order.subtotal * defaultCommissionRate) / 100;
        console.log(`📊 [Earning Calc] Percentage-based: ${order.subtotal} × ${defaultCommissionRate}% = ₹${earning.toFixed(2)}`);
        return Math.round(earning * 100) / 100;
    } catch (error) {
        console.error('Error calculating estimated delivery boy earning:', error);
        // Return a safe default - 5% of subtotal
        return Math.round((order.subtotal * 5) / 100 * 100) / 100;
    }
}

// Track order notification state
export interface OrderNotificationState {
    orderId: string;
    notifiedDeliveryBoys: Set<string>;
    rejectedDeliveryBoys: Set<string>;
    acceptedBy: string | null;
}

export const notificationStates = new Map<string, OrderNotificationState>();

/** Default cap when admin setting is missing */
export const DEFAULT_MAX_CONCURRENT_ORDERS_PER_BOY = 3;

/** Counts toward concurrent limit while partner is on a trip */
export const ACTIVE_DELIVERY_BOY_STATUSES = [
    'Assigned',
    'Picked Up',
    'In Transit',
] as const;

const TERMINAL_ORDER_STATUSES = ['Delivered', 'Cancelled', 'Rejected', 'Returned'];

/**
 * Max active orders per delivery partner (from admin settings).
 */
export async function getMaxConcurrentOrdersPerBoy(): Promise<number> {
    try {
        // @ts-ignore - getSettings is a static method
        const settings = await AppSettings.getSettings();
        const max = settings?.deliveryConfig?.maxConcurrentOrdersPerBoy;
        if (typeof max === 'number' && max >= 1 && max <= 10) {
            return max;
        }
    } catch (error) {
        console.error('Error reading maxConcurrentOrdersPerBoy:', error);
    }
    return DEFAULT_MAX_CONCURRENT_ORDERS_PER_BOY;
}

/**
 * How many non-completed orders this delivery partner currently has.
 */
export async function getActiveOrderCountForDeliveryBoy(
    deliveryBoyId: string | mongoose.Types.ObjectId
): Promise<number> {
    const boyId =
        typeof deliveryBoyId === 'string'
            ? new mongoose.Types.ObjectId(deliveryBoyId)
            : deliveryBoyId;

    return Order.countDocuments({
        deliveryBoy: boyId,
        status: { $nin: TERMINAL_ORDER_STATUSES },
        deliveryBoyStatus: { $in: [...ACTIVE_DELIVERY_BOY_STATUSES] },
    });
}

/**
 * Delivery partners at or above the concurrent order cap.
 */
async function getDeliveryBoyIdsAtCapacity(
    deliveryBoyIds: mongoose.Types.ObjectId[]
): Promise<Set<string>> {
    if (deliveryBoyIds.length === 0) {
        return new Set();
    }

    const maxConcurrent = await getMaxConcurrentOrdersPerBoy();

    const activeCounts = await Order.aggregate([
        {
            $match: {
                deliveryBoy: { $in: deliveryBoyIds },
                status: { $nin: TERMINAL_ORDER_STATUSES },
                deliveryBoyStatus: { $in: [...ACTIVE_DELIVERY_BOY_STATUSES] },
            },
        },
        { $group: { _id: '$deliveryBoy', count: { $sum: 1 } } },
    ]);

    const atCapacity = new Set<string>();
    for (const row of activeCounts) {
        if (row.count >= maxConcurrent) {
            atCapacity.add(row._id.toString());
        }
    }
    return atCapacity;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Find all available delivery boys (online and active)
 */
export async function findAvailableDeliveryBoys(): Promise<mongoose.Types.ObjectId[]> {
    try {
        const deliveryBoys = await Delivery.find({
            isOnline: true,
            status: 'Approved',
        }).select('_id');

        return deliveryBoys.map(db => db._id);
    } catch (error) {
        console.error('Error finding available delivery boys:', error);
        return [];
    }
}

/**
 * Find delivery boys near a specific location within a radius
 * Uses the delivery boy's location from the Delivery model (preferred)
 * or falls back to DeliveryTracking
 */
/** Manual distance filter when MongoDB has no 2dsphere index on deliveries.location */
async function findDeliveryBoysNearLocationManual(
    latitude: number,
    longitude: number,
    radiusKm: number
): Promise<{ deliveryBoyId: mongoose.Types.ObjectId; distance: number }[]> {
    const candidates = await Delivery.find({
        isOnline: true,
        status: 'Approved',
        'location.coordinates.0': { $exists: true },
        'location.coordinates.1': { $exists: true },
    }).select('_id location');

    const nearby: { deliveryBoyId: mongoose.Types.ObjectId; distance: number }[] = [];
    for (const db of candidates) {
        if (!db.location?.coordinates) continue;
        const [dbLng, dbLat] = db.location.coordinates;
        const distance = calculateDistance(latitude, longitude, dbLat, dbLng);
        if (distance <= radiusKm) {
            nearby.push({ deliveryBoyId: db._id as mongoose.Types.ObjectId, distance });
        }
    }
    nearby.sort((a, b) => a.distance - b.distance);
    if (nearby.length > 0) {
        debugLog(`📍 Found ${nearby.length} delivery boys via manual distance (no geo index)`);
    }
    return nearby;
}

export async function findDeliveryBoysNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10
): Promise<{ deliveryBoyId: mongoose.Types.ObjectId; distance: number }[]> {
    try {
        // 1. Try to find delivery boys using the new GeoJSON location field in Delivery model
        const nearbyDeliveryBoys: { deliveryBoyId: mongoose.Types.ObjectId; distance: number }[] = [];

        let deliveryBoysWithLocation: any[] = [];
        try {
            deliveryBoysWithLocation = await Delivery.find({
                isOnline: true,
                status: 'Approved',
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [longitude, latitude]
                        },
                        $maxDistance: radiusKm * 1000 // Convert km to meters
                    }
                }
            }).select('_id location');
        } catch (geoErr: any) {
            if (geoErr?.code === 291 || geoErr?.codeName === 'NoQueryExecutionPlans') {
                return findDeliveryBoysNearLocationManual(latitude, longitude, radiusKm);
            }
            throw geoErr;
        }

        if (deliveryBoysWithLocation.length > 0) {
            for (const db of deliveryBoysWithLocation) {
                if (db.location && db.location.coordinates) {
                    const [dbLng, dbLat] = db.location.coordinates;
                    const distance = calculateDistance(latitude, longitude, dbLat, dbLng);
                    nearbyDeliveryBoys.push({
                        deliveryBoyId: db._id as mongoose.Types.ObjectId,
                        distance
                    });
                }
            }

            console.log(`📍 Found ${nearbyDeliveryBoys.length} delivery boys using live location within ${radiusKm}km of seller`);
            return nearbyDeliveryBoys.sort((a, b) => a.distance - b.distance);
        }

        console.log(`⚠️ No delivery boys found within ${radiusKm}km using live location. Checking fallback...`);

        // 2. Fallback to the old method using DeliveryTracking if no delivery boys found with the new field
        // Get all active and online delivery boys
        const allDeliveryBoys = await Delivery.find({
            isOnline: true,
            status: 'Approved',
        }).select('_id');

        if (allDeliveryBoys.length === 0) {
            return [];
        }

        // Get latest locations for these delivery boys from DeliveryTracking
        const deliveryBoyIds = allDeliveryBoys.map(db => db._id);

        // Get the most recent tracking record for each delivery boy
        const trackingRecords = await DeliveryTracking.aggregate([
            {
                $match: {
                    deliveryBoy: { $in: deliveryBoyIds },
                    // Check both legacy fields and new currentLocation structure
                    $or: [
                        { 'currentLocation.latitude': { $exists: true }, 'currentLocation.longitude': { $exists: true } },
                        { latitude: { $exists: true }, longitude: { $exists: true } }
                    ]
                }
            },
            {
                $sort: { 'currentLocation.timestamp': -1, updatedAt: -1 }
            },
            {
                $group: {
                    _id: '$deliveryBoy',
                    latestLocation: { $first: '$currentLocation' },
                    legacyLat: { $first: '$latitude' },
                    legacyLng: { $first: '$longitude' }
                }
            }
        ]);

        for (const record of trackingRecords) {
            const deliveryLat = record.latestLocation?.latitude || record.legacyLat;
            const deliveryLng = record.latestLocation?.longitude || record.legacyLng;

            if (deliveryLat && deliveryLng) {
                const distance = calculateDistance(latitude, longitude, deliveryLat, deliveryLng);

                if (distance <= radiusKm) {
                    nearbyDeliveryBoys.push({
                        deliveryBoyId: record._id,
                        distance,
                    });
                }
            }
        }

        // Sort by distance (nearest first)
        nearbyDeliveryBoys.sort((a, b) => a.distance - b.distance);

        console.log(`📍 Found ${nearbyDeliveryBoys.length} delivery boys (fallback) within ${radiusKm}km`);
        return nearbyDeliveryBoys;
    } catch (error) {
        console.error('Error finding nearby delivery boys:', error);
        return [];
    }
}

/**
 * Find delivery boys near seller locations for an order
 * Aggregates all unique sellers from order items and finds delivery boys within their service radius
 */
export async function findDeliveryBoysNearSellerLocations(
    order: any
): Promise<mongoose.Types.ObjectId[]> {
    try {
        // Get unique seller IDs from order items
        const sellerIds = [...new Set(
            order.items
                ?.map((item: any) => {
                    if (item.seller && typeof item.seller === 'object' && item.seller._id) {
                        return item.seller._id.toString();
                    }
                    return item.seller?.toString();
                })
                .filter((id: string) => id && id !== '[object Object]') || []
        )];

        if (sellerIds.length === 0) {
            debugLog('No sellers found in order, falling back to all available delivery boys');
            return findAvailableDeliveryBoys();
        }

        // Get seller locations
        const sellers = await Seller.find({
            _id: { $in: sellerIds },
        }).select('latitude longitude location serviceRadiusKm storeName');

        if (sellers.length === 0) {
            debugLog('No seller database records found, falling back to all available delivery boys');
            return findAvailableDeliveryBoys();
        }

        // Find delivery boys near each seller location
        const nearbyDeliveryBoyMap = new Map<string, { distance: number }>();
        let hasValidSellerLocation = false;

        for (const seller of sellers) {
            let lat: number | null = null;
            let lng: number | null = null;

            // Prioritize GeoJSON location field
            if (seller.location && seller.location.coordinates && 
                seller.location.coordinates[0] !== 0 && seller.location.coordinates[1] !== 0) {
                lng = seller.location.coordinates[0];
                lat = seller.location.coordinates[1];
            } else {
                // Fallback to legacy fields
                lat = seller.latitude ? parseFloat(seller.latitude) : null;
                lng = seller.longitude ? parseFloat(seller.longitude) : null;
            }

            if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                console.log(`Seller ${seller.storeName} has no valid location, skipping nearby search for this seller`);
                continue;
            }

            hasValidSellerLocation = true;
            const radius = (typeof seller.serviceRadiusKm === 'number' && seller.serviceRadiusKm > 0)
                ? seller.serviceRadiusKm
                : 10;
            const nearbyBoys = await findDeliveryBoysNearLocation(lat, lng, radius);

            for (const boy of nearbyBoys) {
                const boyId = boy.deliveryBoyId.toString();
                // Keep the smallest distance if same delivery boy is near multiple sellers
                if (!nearbyDeliveryBoyMap.has(boyId) || nearbyDeliveryBoyMap.get(boyId)!.distance > boy.distance) {
                    nearbyDeliveryBoyMap.set(boyId, { distance: boy.distance });
                }
            }
        }

        // If no nearby boys found OR no valid seller locations found for any seller
        if (nearbyDeliveryBoyMap.size === 0) {
            if (!hasValidSellerLocation) {
                debugLog('⚠️ No sellers had valid locations.');
            } else {
                debugLog('ℹ️ No delivery boys found within service radius of any seller.');
            }
            return [];
        }

        // Sort by distance and return IDs
        const sortedBoys = Array.from(nearbyDeliveryBoyMap.entries())
            .sort((a, b) => a[1].distance - b[1].distance)
            .map(([id]) => new mongoose.Types.ObjectId(id));

        debugLog(`📍 Found ${sortedBoys.length} delivery boys near seller locations`);
        return sortedBoys;
    } catch (error) {
        debugLog(`Error finding delivery boys near seller locations: ${error}`);
        return [];
    }
}


/**
 * Emit new order notification to delivery boys near seller locations
 * Prioritizes delivery boys within the seller's service radius
 */
export async function notifyDeliveryBoysOfNewOrder(
    io: SocketIOServer,
    order: any
): Promise<void> {
    try {
        // Skip courier / ecommerce orders (not local delivery partners)
        if (
            order.orderType === 'ecommerce' ||
            order.deliveryType === 'courier' ||
            (order.deliveryFlow && order.deliveryFlow !== 'auto')
        ) {
            debugLog(
                `ℹ️ [Notification] Skipping delivery notification for ${order.orderNumber} (type=${order.orderType}, flow=${order.deliveryFlow || 'n/a'})`
            );
            return;
        }

        debugLog(`🔔 [Notification] New order ${order.orderNumber} (ID: ${order._id}) accepted by seller. Starting broadcast...`);
        
        // Find delivery boys strictly near seller locations (within service radius)
        let nearbyDeliveryBoyIds = await findDeliveryBoysNearSellerLocations(order);
        
        if (nearbyDeliveryBoyIds.length === 0) {
            debugLog(`ℹ️ [Notification] No online delivery boys currently within radius for order ${order.orderNumber}. Order will be available when a partner enters radius or reconnects.`);
        }

        // Skip partners who already hold max concurrent active orders (default 3)
        const maxConcurrent = await getMaxConcurrentOrdersPerBoy();
        const atCapacityIds = await getDeliveryBoyIdsAtCapacity(nearbyDeliveryBoyIds);

        if (atCapacityIds.size > 0) {
            const originalCount = nearbyDeliveryBoyIds.length;
            const filtered = nearbyDeliveryBoyIds.filter(
                (id) => !atCapacityIds.has(id.toString())
            );
            if (filtered.length > 0) {
                nearbyDeliveryBoyIds = filtered;
            }
            debugLog(
                `ℹ️ Filtered partners at max capacity (${maxConcurrent}). Eligible: ${nearbyDeliveryBoyIds.length}`
            );
        }

        // Calculate estimated delivery boy earning for this order
        const deliveryBoyEarning = await calculateEstimatedDeliveryBoyEarning(order);

        // Prepare order data for notification
        const orderData = {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            deliveryAddress: {
                address: order.deliveryAddress.address,
                city: order.deliveryAddress.city,
                state: order.deliveryAddress.state,
                pincode: order.deliveryAddress.pincode,
            },
            total: order.total,
            subtotal: order.subtotal,
            shipping: order.shipping,
            deliveryBoyEarning: deliveryBoyEarning, // Estimated earning for delivery boy
            createdAt: order.createdAt,
        };

        // Initialize notification state
        const orderId = order._id.toString();
        const notifiedIds = new Set<string>();

        // Notify all nearby delivery boys regardless of current room state
        for (const id of nearbyDeliveryBoyIds) {
            const idString = id.toString().trim();
            const roomName = `delivery-${idString}`;
            
            notifiedIds.add(idString);
            io.to(roomName).emit('new-order', orderData);
            
            // Also send a real Push Notification via FCM
            try {
                const { sendNotificationToUser } = await import('./firebaseAdmin');
                sendNotificationToUser(idString, 'Delivery', {
                    title: '📦 New Order Nearby!',
                    body: `New order #${order.orderNumber} is available. Potential Earning: ₹${deliveryBoyEarning}`,
                    data: {
                        type: 'NEW_ORDER',
                        orderId: order._id.toString(),
                        orderNumber: order.orderNumber
                    }
                });
            } catch (fcmError) {
                console.error(`Error sending FCM to delivery boy ${idString}:`, fcmError);
            }

            debugLog(`📤 Emitted new-order to delivery boy ID: ${idString} via room: ${roomName}`);
        }

        if (notifiedIds.size === 0) {
            debugLog('⚠️ No target delivery boys identified to notify');
            return;
        }

        notificationStates.set(orderId, {
            orderId,
            notifiedDeliveryBoys: notifiedIds,
            rejectedDeliveryBoys: new Set(),
            acceptedBy: null,
        });

        console.log(`📢 Notified ${notifiedIds.size} connected delivery boys near seller locations about order ${order.orderNumber}`);
    } catch (error) {
        console.error('Error notifying delivery boys:', error);
    }
}

/**
 * Find available broadcast orders within radius for a delivery boy
 * Used on app launch, reconnect, and polling so orders are never missed
 */
export async function findAvailableOrdersForDeliveryBoy(
    deliveryBoyId: string
): Promise<any[]> {
    try {
        const normalizedDeliveryBoyId = String(deliveryBoyId).trim();
        if (!mongoose.Types.ObjectId.isValid(normalizedDeliveryBoyId)) {
            return [];
        }

        const deliveryBoy = await Delivery.findById(normalizedDeliveryBoyId).select(
            '_id status isOnline location'
        );

        if (!deliveryBoy || deliveryBoy.status !== 'Approved' || !deliveryBoy.isOnline) {
            return [];
        }

        const maxConcurrent = await getMaxConcurrentOrdersPerBoy();
        const activeCount = await getActiveOrderCountForDeliveryBoy(normalizedDeliveryBoyId);
        if (activeCount >= maxConcurrent) {
            return [];
        }

        let dbLat: number | null = null;
        let dbLng: number | null = null;

        if (
            deliveryBoy.location?.coordinates &&
            Array.isArray(deliveryBoy.location.coordinates) &&
            deliveryBoy.location.coordinates.length === 2 &&
            (deliveryBoy.location.coordinates[0] !== 0 || deliveryBoy.location.coordinates[1] !== 0)
        ) {
            dbLng = Number(deliveryBoy.location.coordinates[0]);
            dbLat = Number(deliveryBoy.location.coordinates[1]);
        } else {
            const latestTracking = await DeliveryTracking.findOne({
                deliveryBoy: deliveryBoy._id,
                $or: [
                    { 'currentLocation.latitude': { $exists: true }, 'currentLocation.longitude': { $exists: true } },
                    { latitude: { $exists: true }, longitude: { $exists: true } }
                ]
            }).sort({ updatedAt: -1 });

            if (latestTracking) {
                dbLat = latestTracking.currentLocation?.latitude ?? latestTracking.latitude ?? null;
                dbLng = latestTracking.currentLocation?.longitude ?? latestTracking.longitude ?? null;
            }
        }

        if (dbLat === null || dbLng === null || isNaN(dbLat) || isNaN(dbLng) || (dbLat === 0 && dbLng === 0)) {
            return [];
        }

        const candidateOrders = await Order.find({
            status: { $in: ['Accepted', 'Preparing', 'Packed', 'Ready for pickup', 'Processing'] },
            $or: [{ deliveryBoy: null }, { deliveryBoy: { $exists: false } }],
            orderType: { $ne: 'ecommerce' },
            deliveryType: { $ne: 'courier' },
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })
        .populate({
            path: 'items',
            populate: { path: 'seller', select: 'location latitude longitude serviceRadiusKm storeName' }
        })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();

        const availableOrders: any[] = [];

        for (const order of candidateOrders) {
            const orderIdStr = order._id.toString();
            const state = notificationStates.get(orderIdStr);
            if (state?.rejectedDeliveryBoys?.has(normalizedDeliveryBoyId)) {
                continue;
            }
            if (state?.acceptedBy) {
                continue;
            }

            let isWithinRange = false;
            let minDistanceKm = Infinity;

            const sellers: any[] = [];
            for (const item of ((order.items || []) as any[])) {
                if (item && item.seller && typeof item.seller === 'object') {
                    sellers.push(item.seller);
                }
            }

            for (const seller of sellers) {
                let sLat: number | null = null;
                let sLng: number | null = null;

                if (
                    seller.location?.coordinates &&
                    Array.isArray(seller.location.coordinates) &&
                    seller.location.coordinates.length === 2 &&
                    (seller.location.coordinates[0] !== 0 || seller.location.coordinates[1] !== 0)
                ) {
                    sLng = Number(seller.location.coordinates[0]);
                    sLat = Number(seller.location.coordinates[1]);
                } else if (seller.latitude && seller.longitude) {
                    const parsedLat = parseFloat(seller.latitude);
                    const parsedLng = parseFloat(seller.longitude);
                    if (!isNaN(parsedLat) && !isNaN(parsedLng) && (parsedLat !== 0 || parsedLng !== 0)) {
                        sLat = parsedLat;
                        sLng = parsedLng;
                    }
                }

                if (sLat !== null && sLng !== null && !isNaN(sLat) && !isNaN(sLng)) {
                    const dist = calculateDistance(sLat, sLng, dbLat, dbLng);
                    const radius = (typeof seller.serviceRadiusKm === 'number' && seller.serviceRadiusKm > 0)
                        ? seller.serviceRadiusKm
                        : 10;
                    if (dist <= radius) {
                        isWithinRange = true;
                        if (dist < minDistanceKm) {
                            minDistanceKm = dist;
                        }
                    }
                }
            }

            if (isWithinRange) {
                const earning = await calculateEstimatedDeliveryBoyEarning(order);
                availableOrders.push({
                    orderId: order._id.toString(),
                    orderNumber: order.orderNumber,
                    customerName: order.customerName,
                    customerPhone: order.customerPhone,
                    deliveryAddress: order.deliveryAddress,
                    total: order.total,
                    subtotal: order.subtotal,
                    shipping: order.shipping,
                    deliveryBoyEarning: earning,
                    distanceKm: Math.round(minDistanceKm * 10) / 10,
                    createdAt: order.createdAt
                });
            }
        }

        return availableOrders;
    } catch (error) {
        console.error('Error finding available orders for delivery boy:', error);
        return [];
    }
}

/**
 * Handle order acceptance by a delivery boy
 * Uses atomic findOneAndUpdate to prevent race conditions when two partners tap Accept
 */
export async function handleOrderAcceptance(
    io: SocketIOServer,
    orderId: string,
    deliveryBoyId: string
): Promise<{ success: boolean; message: string }> {
    debugLog(`🚀 [DEBUG_ACCEPT_START] orderId=${orderId}, deliveryBoyId=${deliveryBoyId}`);
    try {
        const normalizedDeliveryBoyId = String(deliveryBoyId).trim();
        if (!mongoose.Types.ObjectId.isValid(normalizedDeliveryBoyId)) {
            return { success: false, message: 'Invalid delivery partner ID' };
        }
        const boyObjectId = new mongoose.Types.ObjectId(normalizedDeliveryBoyId);

        const state = notificationStates.get(orderId);

        // Check in-memory state
        if (state) {
            if (state.acceptedBy && state.acceptedBy !== normalizedDeliveryBoyId) {
                return { success: false, message: 'Order already accepted by another delivery partner' };
            }
            if (state.rejectedDeliveryBoys.has(normalizedDeliveryBoyId)) {
                return { success: false, message: 'You have already rejected this order' };
            }
        }

        // Capacity check
        const maxConcurrent = await getMaxConcurrentOrdersPerBoy();
        const activeCount = await getActiveOrderCountForDeliveryBoy(normalizedDeliveryBoyId);
        if (activeCount >= maxConcurrent) {
            return {
                success: false,
                message: `You already have ${activeCount} active orders (maximum ${maxConcurrent}). Complete one before accepting more.`,
            };
        }

        // ATOMIC MongoDB assignment
        const assignedOrder = await Order.findOneAndUpdate(
            {
                _id: orderId,
                $or: [
                    { deliveryBoy: null },
                    { deliveryBoy: { $exists: false } },
                    { deliveryBoy: boyObjectId } // Idempotent re-acceptance
                ],
                status: { $in: ['Accepted', 'Preparing', 'Packed', 'Ready for pickup', 'Processing', 'Assigned'] },
                orderType: { $ne: 'ecommerce' },
                deliveryType: { $ne: 'courier' }
            },
            {
                $set: {
                    deliveryBoy: boyObjectId,
                    deliveryBoyStatus: 'Assigned',
                    assignedAt: new Date(),
                    status: 'Assigned'
                }
            },
            { new: true }
        );

        if (!assignedOrder) {
            const currentOrder = await Order.findById(orderId).select('deliveryBoy orderNumber status');
            if (!currentOrder) {
                return { success: false, message: 'Order not found' };
            }
            if (currentOrder.deliveryBoy && currentOrder.deliveryBoy.toString() !== normalizedDeliveryBoyId) {
                return { success: false, message: 'Order was just accepted by another delivery partner' };
            }
            return { success: false, message: 'Order is no longer available for assignment' };
        }

        if (state) {
            state.acceptedBy = normalizedDeliveryBoyId;
        }

        debugLog(`✅ [handleOrderAcceptance] Order ${orderId} atomically assigned to ${normalizedDeliveryBoyId}`);

        // Broadcast order-accepted event to clear notifications across all listening delivery boys
        io.to('delivery-notifications').emit('order-accepted', {
            orderId,
            acceptedBy: normalizedDeliveryBoyId,
        });

        if (state) {
            for (const notifiedId of state.notifiedDeliveryBoys) {
                const notifiedIdString = String(notifiedId).trim();
                io.to(`delivery-${notifiedIdString}`).emit('order-accepted', {
                    orderId,
                    acceptedBy: normalizedDeliveryBoyId,
                });
            }
            notificationStates.delete(orderId);
        } else {
            io.to(`delivery-${normalizedDeliveryBoyId}`).emit('order-accepted', {
                orderId,
                acceptedBy: normalizedDeliveryBoyId,
            });
        }

        // Customer real-time notification
        io.to(`order-${orderId}`).emit('delivery-boy-accepted', {
            orderId,
            deliveryBoyId: normalizedDeliveryBoyId,
            message: 'Delivery partner accepted your order. Tracking started.',
        });

        try {
            const { notifyCustomerOrderUpdate } = await import('./customerOrderNotificationService');
            await notifyCustomerOrderUpdate(
                io,
                assignedOrder,
                'Delivery partner assigned',
                `A delivery partner accepted order #${assignedOrder.orderNumber} and is on the way.`
            );
        } catch (custErr) {
            console.error('Customer notification after delivery accept failed:', custErr);
        }

        return { success: true, message: 'Order accepted successfully' };
    } catch (error) {
        debugLog(`❌ [handleOrderAcceptance] Error: ${error}`);
        return { success: false, message: 'Error accepting order' };
    }
}

/**
 * Handle order rejection by a delivery boy
 */
export async function handleOrderRejection(
    io: SocketIOServer,
    orderId: string,
    deliveryBoyId: string
): Promise<{ success: boolean; message: string; allRejected: boolean }> {
    try {
        const state = notificationStates.get(orderId);

        if (!state) {
            return { success: false, message: 'Order notification not found', allRejected: false };
        }

        // Check if already accepted
        if (state.acceptedBy) {
            return { success: false, message: 'Order already accepted', allRejected: false };
        }

        // If this delivery boy was not in the initial notified list (e.g. they received it via general broadcast)
        // we allow them to reject it anyway.
        const normalizedDeliveryBoyId = String(deliveryBoyId).trim();
        if (!state.notifiedDeliveryBoys.has(normalizedDeliveryBoyId)) {
            console.log(`ℹ️ Delivery boy ${normalizedDeliveryBoyId} rejecting order ${orderId} via general broadcast (not in initial nearby list)`);
            // Add them to notified list so the 'allRejected' logic counts them correctly
            state.notifiedDeliveryBoys.add(normalizedDeliveryBoyId);
        }

        // Check if already rejected
        if (state.rejectedDeliveryBoys.has(normalizedDeliveryBoyId)) {
            return { success: true, message: 'You have already rejected this order', allRejected: false };
        }

        // Mark as rejected
        state.rejectedDeliveryBoys.add(normalizedDeliveryBoyId);

        // Check if all delivery boys have rejected
        const allRejected = state.rejectedDeliveryBoys.size === state.notifiedDeliveryBoys.size;

        if (allRejected) {
            // Emit order-rejected-by-all event
            io.to('delivery-notifications').emit('order-rejected-by-all', {
                orderId,
            });

            try {
                // Update order with notes but DO NOT reject automatically
                // This allows the seller/admin to manually assign or wait for other boys to become online
                const order = await Order.findById(orderId);
                if (order) {
                    // order.status = 'Rejected'; // Disabled automatic rejection
                    order.deliveryBoyStatus = 'Failed';
                    order.adminNotes = (order.adminNotes ? order.adminNotes + '\n' : '') +
                        `[${new Date().toISOString()}] Broadcast Failed: All notified delivery boys (${state.notifiedDeliveryBoys.size}) rejected the order. Waiting for manual assignment or retry.`;
                    await order.save();

                    // Notify sellers/restaurants that broadcast failed
                    notifySellersOfOrderUpdate(io, order, 'BROADCAST_FAILED');

                    console.log(`⚠️ All delivery boys rejected order ${orderId}. Order remains Accepted for manual intervention.`);
                } else {
                    console.error(`❌ Order ${orderId} not found when trying to update rejection status`);
                }
            } catch (dbError) {
                console.error(`❌ Error updating order ${orderId} to Rejected status:`, dbError);
                // We still proceed with cleanup to avoid memory leaks/stuck state
            }

            // Clean up notification state
            notificationStates.delete(orderId);
        } else {
            // Emit rejection acknowledgment to the specific delivery boy
            io.to(`delivery-${deliveryBoyId}`).emit('order-rejection-acknowledged', {
                orderId,
            });
        }

        console.log(`🚫 Delivery boy ${deliveryBoyId} rejected order ${orderId}`);
        return { success: true, message: 'Order rejected', allRejected };
    } catch (error) {
        console.error('Error handling order rejection:', error);
        return { success: false, message: 'Error rejecting order', allRejected: false };
    }
}

/**
 * Get notification state for an order
 */
export function getNotificationState(orderId: string): OrderNotificationState | undefined {
    return notificationStates.get(orderId);
}

/**
 * Clean up notification state (for testing or manual cleanup)
 */
export function clearNotificationState(orderId: string): void {
    notificationStates.delete(orderId);
}

