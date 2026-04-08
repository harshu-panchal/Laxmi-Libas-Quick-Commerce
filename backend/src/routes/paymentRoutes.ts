import { Router } from 'express';
import { authenticate, requireUserType } from '../middleware/auth';
import { Request, Response } from 'express';
import { 
    createPhonePeOrder, 
    handlePhonePeCallback, 
    getPhonePePaymentStatus, 
    processPhonePeRefund 
} from '../services/paymentService';
import mongoose from 'mongoose';

const router = Router();

/**
 * @route   POST /api/v1/payment/phonepe/create
 * @desc    Initialize a PhonePe payment flow
 * @access  Private (Customer)
 */
router.post('/create', authenticate, requireUserType('Customer'), async (req: Request, res: Response) => {
    try {
        const { orderId } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ success: false, message: 'Invalid Order ID' });
        }

        const result = await createPhonePeOrder(orderId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('[PhonePe Route Error]:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Server Error' 
        });
    }
});

/**
 * @route   GET /api/v1/payment/phonepe/status/:merchantOrderId
 * @desc    Manual polling for payment status
 * @access  Private
 */
router.get('/status/:merchantOrderId', authenticate, async (req: Request, res: Response) => {
    try {
        const result = await getPhonePePaymentStatus(req.params.merchantOrderId);

        if (result.success) {
            // Standardizing status for frontend UI
            let mappedStatus = 'pending';
            if (result.status === 'COMPLETED') mappedStatus = 'success';
            if (result.status === 'FAILED') mappedStatus = 'failed';
            
            return res.status(200).json({ 
                success: true, 
                status: mappedStatus, 
                data: result.data 
            });
        }

        return res.status(400).json(result);
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /api/v1/payment/phonepe/callback
 * @desc    Webhook for PhonePe transaction updates
 * @access  Public
 */
router.post('/callback', async (req: Request, res: Response) => {
    try {
        const xVerify = req.headers['x-verify'] as string;
        await handlePhonePeCallback(req.body, xVerify);
        
        // PhonePe expects a 200 OK for successful delivery
        return res.status(200).send('OK');
    } catch (error: any) {
        console.error('[Webhook Error]:', error);
        return res.status(500).send('Error');
    }
});

/**
 * @route   POST /api/v1/payment/phonepe/refund
 * @desc    Initiate refund (Admin only)
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
