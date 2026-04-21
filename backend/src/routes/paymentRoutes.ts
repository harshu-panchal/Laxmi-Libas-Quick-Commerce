import { Router, Request, Response } from 'express';
import { authenticate, requireUserType } from '../middleware/auth';
import { 
    createPhonePeOrder, 
    handlePhonePeCallback, 
    getPhonePePaymentStatus, 
    processPhonePeRefund 
} from '../services/paymentService';
import { notifySellersOfOrderUpdate } from '../services/sellerNotificationService';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';

const router = Router();

/**
 * @desc    🎯 Rebuild Phase: Create Payment
 * @route   POST /api/v1/payment/phonepe/create
 * @access  Private (Customer)
 */
router.post('/create', authenticate, requireUserType('Customer'), async (req: Request, res: Response) => {
    try {
        const { orderId, paymentType = 'quick' } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ success: false, message: 'Invalid format for Order/Booking ID' });
        }

        if (!['quick', 'ecommerce', 'hotel', 'bus'].includes(paymentType)) {
            return res.status(400).json({ success: false, message: 'Invalid payment type' });
        }

        // Determine dynamic FRONTEND_URL based on request origin
        let frontendUrl = process.env.FRONTEND_URL || 'https://laxmart.store';
        
        try {
            const originHeader = (req.headers.origin as string) || (req.headers.referer as string);
            if (originHeader) {
                const url = new URL(originHeader);
                frontendUrl = url.origin;
            }
        } catch (err) {
            console.warn('[LegacyPaymentRoute] Failed to parse origin header, falling back to ENV');
        }
        
        frontendUrl = frontendUrl.replace(/\/$/, '');

        const result = await createPhonePeOrder(orderId, frontendUrl, paymentType);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('[PhonePe Route] Payment Init Error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error during payment creation' 
        });
    }
});

/**
 * @desc    🎯 Rebuild Phase: Manual Status Check
 * @route   GET /api/v1/payment/phonepe/status/:merchantOrderId
 * @access  Private
 */
router.get('/status/:merchantOrderId', authenticate, async (req: Request, res: Response) => {
    try {
        const result = await getPhonePePaymentStatus(req.params.merchantOrderId);

        if (result.success) {
            // Normalize status for UI compatibility
            let statusLabel = 'pending';
            if (result.status === 'COMPLETED') statusLabel = 'success';
            if (result.status === 'FAILED') statusLabel = 'failed';
            
            if (result.justPaid && result.order) {
                try {
                    const io: SocketIOServer = (req.app.get("io") as SocketIOServer);
                    if (io) {
                        console.log(`[LegacyPaymentRoute] 🚀 Payment SUCCESS for Order ${result.order.orderNumber}. Notifying sellers...`);
                        await notifySellersOfOrderUpdate(io, (result as any).order, 'NEW_ORDER');
                        console.log(`[LegacyPaymentRoute] ✅ Seller notification sent for Order ${result.order.orderNumber}`);
                    } else {
                        console.error('[LegacyPaymentRoute] ❌ Socket.io (io) not found on req.app');
                    }
                } catch (err) {
                    console.error('[LegacyPaymentRoute] ❌ Error notifying sellers on status check:', err);
                }
            }

            return res.status(200).json({ 
                success: true, 
                status: statusLabel, 
                data: result.data 
            });
        }

        return res.status(400).json(result);
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @desc    🎯 Rebuild Phase: Secure Webhook Callback
 * @route   POST /api/v1/payment/phonepe/callback
 * @access  Public
 */
router.post('/callback', async (req: Request, res: Response) => {
    try {
        const result = await handlePhonePeCallback(req.body);
        
        if (result.success && (result as any).justPaid && (result as any).order) {
            try {
                const io: SocketIOServer = (req.app.get("io") as SocketIOServer);
                if (io) {
                    console.log(`[LegacyPaymentRoute] 🚀 Webhook SUCCESS for Order ${(result as any).order.orderNumber}. Notifying sellers...`);
                    await notifySellersOfOrderUpdate(io, (result as any).order, 'NEW_ORDER');
                    console.log(`[LegacyPaymentRoute] ✅ Seller notification sent via Webhook for Order ${(result as any).order.orderNumber}`);
                } else {
                    console.error('[LegacyPaymentRoute] ❌ Socket.io (io) not found on req.app');
                }
            } catch (err) {
                console.error('[LegacyPaymentRoute] ❌ Error notifying sellers on callback:', err);
            }
        }

        // Return 200 OK to acknowledge receipt to PhonePe servers
        return res.status(200).send('OK');
    } catch (error: any) {
        console.error('[PhonePe Webhook Error]:', error);
        return res.status(500).send('Error Processing Webhook');
    }
});

/**
 * @desc    🎯 Rebuild Phase: Admin Initiated Refund
 * @route   POST /api/v1/payment/phonepe/refund
 * @access  Private (Admin)
 */
router.post('/refund', authenticate, requireUserType('Admin'), async (req: Request, res: Response) => {
    try {
        const { paymentId, amount } = req.body;
        const result = await processPhonePeRefund(paymentId, amount);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
