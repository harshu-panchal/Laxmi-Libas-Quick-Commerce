import Order from '../models/Order';
import { DelhiveryService } from '../services/shipping/DelhiveryService';
import { OrderSettlementService } from '../services/orderSettlementService';

/**
 * Polling system to synchronize tracking status for active shipments.
 * Useful as a fallback if webhooks are missed.
 */
export const startCourierSyncJob = () => {
    // Run every 30 minutes
    const INTERVAL = 30 * 60 * 1000;
    
    console.log('[Job] Courier Sync Job initialized (30 min interval)');
    
    setInterval(async () => {
        try {
            console.log('[Job] Starting Courier Sync poll...');
            
            // Find orders that are in transit but not yet delivered
            const activeOrders = await Order.find({
                status: { $in: ['Shipped', 'On the way', 'Out for Delivery'] },
                trackingId: { $exists: true, $ne: '' },
                courierPartner: 'Delhivery'
            });

            console.log(`[Job] Found ${activeOrders.length} active shipments to poll.`);

            for (const order of activeOrders) {
                try {
                    const trackingInfo = await DelhiveryService.trackShipment(order.trackingId!);
                    
                    // Delhivery tracking response parsing
                    // (Assuming data.ShipmentData[0].Shipment.Status.Status is the location)
                    const scanData = trackingInfo?.ShipmentData?.[0]?.Shipment;
                    if (!scanData) continue;

                    const courierStatus = scanData.Status?.Status?.toUpperCase();
                    if (!courierStatus) continue;

                    // Skip if status hasn't changed
                    if (order.trackingStatus === courierStatus) continue;

                    let systemStatus = order.status;
                    
                    // Map Status (Same logic as webhook)
                    if (courierStatus.includes('DELIVERED') || courierStatus === 'DL') {
                        systemStatus = 'Delivered';
                    } else if (courierStatus.includes('OUT FOR DELIVERY') || courierStatus === 'OFD') {
                        systemStatus = 'Out for Delivery';
                    } else if (courierStatus.includes('IN TRANSIT') || courierStatus === 'IT') {
                        systemStatus = 'On the way';
                    }

                    if (systemStatus !== order.status) {
                        const previousStatus = order.status;
                        order.status = systemStatus as any;
                        order.trackingStatus = courierStatus;
                        
                        if (!order.trackingHistory) order.trackingHistory = [];
                        order.trackingHistory.push({
                            status: courierStatus,
                            location: scanData.Status?.Location || 'N/A',
                            time: new Date(),
                            source: 'Poll'
                        });

                        await order.save();
                        console.log(`[Job] Updated Order ${order.orderNumber}: ${previousStatus} -> ${systemStatus}`);

                        // Trigger settlement if delivered
                        if (systemStatus === 'Delivered' && previousStatus !== 'Delivered') {
                            await OrderSettlementService.settleOrder(order._id.toString());
                        }
                    }
                } catch (orderErr: any) {
                    console.error(`[Job] Error polling order ${order.orderNumber}:`, orderErr.message);
                }
            }
        } catch (err: any) {
            console.error('[Job] Courier Sync Job failed:', err.message);
        }
    }, INTERVAL);
};
