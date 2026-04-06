import { Router } from 'express';
import { authenticate, requireUserType } from '../middleware/auth';
import { Request, Response } from 'express';
import { createPhonePeOrder, handlePhonePeCallback, getPhonePePaymentStatus, processPhonePeRefund } from '../services/paymentService';
import Order from '../models/Order';
import Payment from '../models/Payment';

const router = Router();

router.post('/phonepe/create', authenticate, requireUserType('Customer'), async (req: Request, res: Response) => {
    try {
        const { orderId } = req.body;
        // requestedAmount was unused, removing it.

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.customer.toString() !== req.user!.userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized access to order' });
        }

        const result = await createPhonePeOrder(order.total, req.user!.userId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        // Before returning to client, save the pending payment to DB to track merchantTransactionId
        const payment = new Payment({
            order: order._id,
            customer: order.customer,
            paymentMethod: 'Online',
            paymentGateway: 'PhonePe',
            phonepeMerchantTransactionId: result.data?.merchantTransactionId,
            amount: order.total,
            currency: 'INR',
            status: 'Pending'
        });
        await payment.save();

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('[PaymentRoute] Error creating PhonePe order:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create payment order' });
    }
});

router.post('/phonepe/callback', async (req: Request, res: Response) => {
    try {
        // Validation could be added here to decode headers and ensure authenticity
        const xVerify = req.headers['x-verify'] as string;
        const result = await handlePhonePeCallback(req.body, xVerify);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Error handling PhonePe webhook:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to handle webhook' });
    }
});

router.get('/phonepe/status/:merchantTransactionId', authenticate, async (req: Request, res: Response) => {
    try {
        const result = await getPhonePePaymentStatus(req.params.merchantTransactionId);

        // Map COMPLETED to success, FAILED to failed, PENDING to retry
        if (result.success) {
            let mappedStatus = 'retry';
            if (result.status === 'COMPLETED') mappedStatus = 'success';
            if (result.status === 'FAILED') mappedStatus = 'failed';
            
            return res.status(200).json({ status: mappedStatus, data: result.data });
        }

        return res.status(400).json(result);
    } catch (error: any) {
        console.error('Error checking payment status:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to check status' });
    }
});

router.post('/phonepe/refund', authenticate, requireUserType('Admin'), async (req: Request, res: Response) => {
    try {
        const { paymentId, amount, reason } = req.body;
        const result = await processPhonePeRefund(paymentId, amount, reason);
        if(!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    } catch(error: any) {
        return res.status(500).json({success: false, message: error.message});
    }
});

export default router;
