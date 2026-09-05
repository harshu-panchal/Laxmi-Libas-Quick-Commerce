import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import DeliveryTracking from "../../../models/DeliveryTracking";
import Order from "../../../models/Order";
import OrderItem from "../../../models/OrderItem";
import Seller from "../../../models/Seller";
import Delivery from "../../../models/Delivery";
import { calculateDistance } from "../../../utils/locationHelper";

/**
 * Get tracking information for an order
 * GET /api/v1/customer/orders/:orderId/tracking
 */
export const getOrderTracking = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const customerId = (req as any).user.userId;

    // Verify order belongs to customer
    const order = await Order.findOne({ _id: orderId, customer: customerId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // For Ecommerce orders, return tracking info and history from order model
    if (order.orderType === 'ecommerce') {
      return res.status(200).json({
        success: true,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          orderType: 'ecommerce',
          tracking: {
            courierPartner: order.courierPartner || 'N/A',
            trackingId: order.trackingId || 'N/A',
            estimatedDeliveryDate: order.estimatedDeliveryDate,
            status: order.status, // For ecommerce, order status reflects tracking status mostly
            trackingHistory: order.trackingHistory || []
          },
          deliveryAddress: order.deliveryAddress,
        },
      });
    }

    // Get latest tracking information (for Quick commerce)
    const tracking = await DeliveryTracking.findOne({ order: orderId })
      .sort({ updatedAt: -1 })
      .populate("deliveryBoy", "name phone profileImage")
      .lean();

    if (!tracking) {
      return res.status(200).json({
        success: true,
        data: {
           orderId: order._id,
           orderNumber: order.orderNumber,
           status: order.status,
           orderType: 'quick',
           tracking: null,
           message: "Tracking information not available yet (Wait for delivery partner assignment)",
           deliveryAddress: order.deliveryAddress
        }
      });
    }

    // Get delivery address from order
    const deliveryAddress = order.deliveryAddress;

    return res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        orderType: 'quick',
        tracking: {
          deliveryBoy: tracking.deliveryBoy,
          currentLocation: tracking.currentLocation,
          route: tracking.route,
          eta: tracking.eta,
          distance: tracking.distance,
          status: tracking.status,
          lastUpdated: tracking.updatedAt,
        },
        deliveryAddress: deliveryAddress,
      },
    });
  }
);

/**
 * Update delivery partner location (called by delivery app)
 * POST /api/v1/delivery/location
 */
export const updateDeliveryLocation = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId, latitude, longitude } = req.body;
    const deliveryBoyId = req.user?.userId;

    // Validate inputs
    if (!orderId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Order ID, latitude, and longitude are required",
      });
    }

    // Verify order is assigned to this delivery partner
    const order = await Order.findOne({
      _id: orderId,
      deliveryBoy: deliveryBoyId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not assigned to you",
      });
    }

    // Calculate distance to delivery address
    const deliveryLat = order.deliveryAddress?.latitude || 0;
    const deliveryLng = order.deliveryAddress?.longitude || 0;

    // Find or create tracking record
    let tracking = await DeliveryTracking.findOne({ order: orderId });

    if (!tracking) {
      // Determine initial status based on order status
      let initialStatus: 'idle' | 'picked_up' | 'in_transit' | 'nearby' = 'idle';
      if (order.status === 'Picked up' || order.status === 'Out for Delivery') {
        initialStatus = 'picked_up';
      } else {
        initialStatus = 'idle';
      }

      tracking = new DeliveryTracking({
        order: orderId,
        deliveryBoy: deliveryBoyId,
        latitude, // Legacy field
        longitude, // Legacy field
        currentLocation: {
          latitude,
          longitude,
          timestamp: new Date(),
        },
        route: [{ lat: latitude, lng: longitude }],
        status: initialStatus,
      });
    } else {
      tracking.currentLocation = {
        latitude,
        longitude,
        timestamp: new Date(),
      };
      // Update legacy fields
      tracking.latitude = latitude;
      tracking.longitude = longitude;
      // Add to route history (keep last 50 points)
      tracking.route.push({ lat: latitude, lng: longitude });
      if (tracking.route.length > 50) {
        tracking.route = tracking.route.slice(-50);
      }
    }

    // Calculate distance and ETA
    const distance = tracking.calculateDistance(deliveryLat, deliveryLng);
    const eta = tracking.calculateETA(distance);

    tracking.distance = distance;
    tracking.eta = eta;

    // Update status based on order status and distance
    if (order.status === 'Delivered') {
      tracking.status = "delivered";
    } else if (order.status === 'Picked up' || order.status === 'Out for Delivery') {
      if (distance < 100) {
        tracking.status = "nearby";
      } else if (distance < 5000) {
        tracking.status = "in_transit";
      } else {
        tracking.status = "picked_up";
      }
    } else {
      // Order is still assigned but not picked up yet
      tracking.status = "idle";
    }

    await tracking.save();

    // Sync tracking status and location back to Order model for unified tracking
    const orderTrackingStatusMap: Record<string, "assigned" | "picked" | "on_the_way" | "delivered"> = {
      'idle': 'assigned',
      'picked_up': 'picked',
      'in_transit': 'on_the_way',
      'nearby': 'on_the_way',
      'delivered': 'delivered'
    };

    await Order.findByIdAndUpdate(orderId, {
      currentLocation: {
        lat: latitude,
        lng: longitude,
        updatedAt: new Date()
      },
      trackingStatus: orderTrackingStatusMap[tracking.status] || 'assigned'
    });

    // Also update the delivery partner's general location
    await Delivery.findByIdAndUpdate(deliveryBoyId, {
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    });

    // Emit update via Socket.io
    const io = (req.app as any).get("io");
    if (io) {
      // Standard location update
      io.to(`order-${orderId}`).emit("location-update", {
        orderId,
        location: tracking.currentLocation,
        eta: tracking.eta,
        distance: tracking.distance,
        status: tracking.status,
      });

      // Specific live tracking event
      io.to(`order-${orderId}`).emit("delivery:location", {
        orderId,
        lat: latitude,
        lng: longitude,
        eta: tracking.eta,
        distance: tracking.distance,
        status: tracking.status
      });

      // Direct customer notification
      if (order.customer) {
        io.to(order.customer.toString()).emit("delivery:location", {
          orderId,
          lat: latitude,
          lng: longitude,
          eta: tracking.eta
        });
      }
    }


    return res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: {
        distance,
        eta,
        status: tracking.status,
      },
    });
  }
);

/**
 * Update general delivery partner location (when not on a specific order)
 * POST /api/v1/delivery/location/general
 */
export const updateGeneralLocation = asyncHandler(
  async (req: Request, res: Response) => {
    const { latitude, longitude } = req.body;
    const deliveryBoyId = req.user?.userId;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const deliveryBoy = await Delivery.findById(deliveryBoyId);

    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    // Update delivery partner's current location
    deliveryBoy.location = {
      type: "Point",
      coordinates: [longitude, latitude],
    };

    await deliveryBoy.save();

    return res.status(200).json({
      success: true,
      message: "General location updated successfully",
      data: {
        location: deliveryBoy.location,
      },
    });
  }
);

/**
 * Get delivery partner's active orders with tracking
 * GET /api/v1/delivery/active-orders
 */
export const getActiveOrdersTracking = asyncHandler(
  async (req: Request, res: Response) => {
    const deliveryBoyId = (req as any).user.userId;

    const trackings = await DeliveryTracking.find({
      deliveryBoy: deliveryBoyId,
      status: { $in: ["picked_up", "in_transit", "nearby"] },
    })
      .populate("order", "orderNumber status deliveryAddress")
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: trackings,
    });
  }
);

/**
 * Get Seller Locations for Order (Customer endpoint)
 * Returns all unique seller shop locations for items in this order
 * GET /api/v1/customer/orders/:orderId/seller-locations
 */
export const getSellerLocationsForOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const customerId = (req as any).user.userId;

    // Verify order exists and belongs to this customer
    const order = await Order.findOne({ _id: orderId, customer: customerId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Get all unique seller IDs from order items
    const orderItems = await OrderItem.find({ order: orderId });
    const sellerIds = [...new Set(orderItems.map((item) => item.seller.toString()))];

    // Get seller details including locations
    const sellers = await Seller.find({ _id: { $in: sellerIds } }).select(
      "storeName address city latitude longitude"
    );

    // Format seller locations
    const sellerLocations = sellers
      .filter((seller) => seller.latitude && seller.longitude) // Only include sellers with location data
      .map((seller) => ({
        sellerId: seller._id.toString(),
        storeName: seller.storeName,
        address: seller.address,
        city: seller.city,
        latitude: parseFloat(seller.latitude || "0"),
        longitude: parseFloat(seller.longitude || "0"),
      }));

    return res.status(200).json({
      success: true,
      data: sellerLocations,
    });
  }
);

/**
 * Get count of sellers whose service radius includes the delivery boy's location
 * GET /api/v1/delivery/location/sellers-in-radius
 */
export const getSellersInRadius = asyncHandler(
  async (req: Request, res: Response) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);

    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180 ||
      (lat === 0 && lng === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude",
      });
    }

    let sellersInRange: any[] = [];

    try {
      // Primary: Use aggregation with $geoNear
      sellersInRange = await Seller.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lng, lat] },
            distanceField: "distanceFromDeliveryBoy", // in meters
            spherical: true,
            key: "location",
            query: {
              status: "Approved",
              "location.coordinates": { $ne: [0, 0] },
            },
          },
        },
        {
          $addFields: {
            // serviceRadiusKm is in kilometers, distanceFromDeliveryBoy is in meters
            // Safely default to 10km if serviceRadiusKm is missing/null
            radiusInMeters: {
              $multiply: [{ $ifNull: ["$serviceRadiusKm", 10] }, 1000],
            },
          },
        },
        {
          $match: {
            $expr: {
              $lte: ["$distanceFromDeliveryBoy", "$radiusInMeters"],
            },
          },
        },
        {
          $project: {
            _id: 1,
            storeName: 1,
            address: 1,
            serviceRadiusKm: { $ifNull: ["$serviceRadiusKm", 10] },
            distanceFromDeliveryBoy: 1,
          },
        },
      ]);
    } catch (geoErr) {
      console.warn("MongoDB $geoNear aggregation failed, falling back to Haversine calculation:", geoErr);
      // Fallback: Haversine manual calculation
      const approvedSellers = await Seller.find({ status: "Approved" }).select(
        "_id storeName address location latitude longitude serviceRadiusKm"
      );

      for (const seller of approvedSellers) {
        let sLat: number | null = null;
        let sLng: number | null = null;

        if (
          seller.location &&
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

        if (
          sLat === null ||
          sLng === null ||
          isNaN(sLat) ||
          isNaN(sLng) ||
          sLat < -90 ||
          sLat > 90 ||
          sLng < -180 ||
          sLng > 180
        ) {
          continue;
        }

        const distKm = calculateDistance(lat, lng, sLat, sLng);
        const radiusKm =
          typeof seller.serviceRadiusKm === "number" && seller.serviceRadiusKm > 0
            ? seller.serviceRadiusKm
            : 10;

        if (distKm <= radiusKm) {
          sellersInRange.push({
            _id: seller._id,
            storeName: seller.storeName,
            address: seller.address,
            serviceRadiusKm: radiusKm,
            distanceFromDeliveryBoy: Math.round(distKm * 1000), // meters
          });
        }
      }

      sellersInRange.sort((a, b) => a.distanceFromDeliveryBoy - b.distanceFromDeliveryBoy);
    }

    return res.status(200).json({
      success: true,
      data: {
        count: sellersInRange.length,
        sellers: sellersInRange,
      },
    });
  }
);
