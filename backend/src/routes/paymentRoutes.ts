import { Router, Request, Response } from 'express';
import { authenticate, requireUserType } from '../middleware/auth';
import { 
    createPhonePeOrder, 
    handlePhonePeCallback, 
    getPhonePePaymentStatus, 
    processPhonePeRefund 
} from '../services/paymentService';
import mongoose from 'mongoose';

const router = Router();

/**
 * @desc    🎯 Rebuild Phase: Create Payment
 * @route   POST /api/v1/payment/phonepe/create
 * @access  Private (Customer)
 */
router.post('/create', authenticate, requireUserType('Customer'), async (req: Request, res: Response) => {
    try {
        const { orderId } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ success: false, message: 'Invalid format for Order ID' });
        }

        const result = await createPhonePeOrder(orderId);

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
        const xVerify = req.headers['x-verify'] as string;
        await handlePhonePeCallback(req.body, xVerify);
        
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
