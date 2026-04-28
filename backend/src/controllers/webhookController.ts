import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import Order from '../models/Order';
import { OrderSettlementService } from '../services/orderSettlementService';

/**
 * Handle Delhivery Webhook Status Updates
 * 
 * Delhivery sends post-back updates to this endpoint.
 * Payload usually contains: waybill, status, status_time, location, etc.
 */
export const handleCourierWebhook = asyncHandler(
    async (req: Request, res: Response) => {
        const data = req.body;
        
        // 1. Security Check (Optional but recommended)
        const apiKey = req.headers['x-api-key'];
        if (process.env.COURIER_WEBHOOK_KEY && apiKey !== process.env.COURIER_WEBHOOK_KEY) {
            console.warn('[Webhook] Unauthorized access attempt with key:', apiKey);
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        console.log('[Webhook] Received courier update:', JSON.stringify(data));

        // 2. Extract identifiers
        // Note: Delhivery payload fields might vary depending on their specific webhook version.
        // We assume 'waybill' and 'status' are present.
        const trackingId = data.waybill || data.awb || data.tracking_id;
        const courierStatus = (data.status || '').toUpperCase();

        if (!trackingId) {
            return res.status(400).json({ success: false, message: 'Missing tracking identifier' });
        }

        // 3. Find Order
        const order = await Order.findOne({ trackingId });
        if (!order) {
            console.warn('[Webhook] Order not found for tracking ID:', trackingId);
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // 4. Map Status and Update History
        let systemStatus = order.status;
        
        // Delhivery common status codes:
        // DL: Delivered
        // SHP: Shipped
        // IT: In Transit
        // OFD: Out for Delivery
        // CAN: Cancelled
        // RTN: Returned
        
        switch (courierStatus) {
            case 'SHP':
            case 'SHIPPED':
                systemStatus = 'Shipped';
                break;
            case 'IT':
            case 'IN_TRANSIT':
            case 'IN-TRANSIT':
                systemStatus = 'On the way';
                break;
            case 'OFD':
            case 'OUT_FOR_DELIVERY':
                systemStatus = 'Out for Delivery';
                break;
            case 'DL':
            case 'DELIVERED':
                systemStatus = 'Delivered';
                break;
            case 'CAN':
            case 'CANCELLED':
                systemStatus = 'Cancelled';
                break;
            case 'RTN':
            case 'RETURNED':
                systemStatus = 'Returned';
                break;
        }

        // 5. Save tracking history
        order.trackingStatus = courierStatus;
        if (!order.trackingHistory) order.trackingHistory = [];
        order.trackingHistory.push({
            status: courierStatus,
            location: data.location || 'N/A',
            time: data.status_time || new Date(),
            raw: data
        });

        const previousStatus = order.status;
        order.status = systemStatus as any;
        
        if (systemStatus === 'Delivered') {
            order.paymentStatus = 'Paid';
        }

        await order.save();
        console.log(`[Webhook] Updated Order ${order.orderNumber} status: ${previousStatus} -> ${systemStatus}`);

        // 6. Trigger Payment Settlement on Delivery
        if (systemStatus === 'Delivered' && previousStatus !== 'Delivered') {
            try {
                console.log(`[Webhook] Triggering settlement for Order ${order.orderNumber}`);
                await OrderSettlementService.settleOrder(order._id.toString());
            } catch (settleError: any) {
                console.error(`[Webhook] Settlement failed for Order ${order.orderNumber}:`, settleError.message);
                // We return 200 to Delhivery anyway so they don't retry, but we've logged the error
            }
        }

        return res.status(200).json({ success: true, message: 'Status updated' });
    }
);
