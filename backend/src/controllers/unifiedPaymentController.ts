import { Request, Response } from 'express';
import { createUnifiedPayment, verifyUnifiedPaymentStatus, handleUnifiedWebhook } from '../services/unifiedPaymentService';
import { createPhonePeOrder, getPhonePePaymentStatus, handlePhonePeCallback } from '../services/paymentService';

export const createPayment = async (req: Request, res: Response) => {
    try {
        const { orderId, paymentType } = req.body;
        const userId = (req as any).user.userId;

        if (!orderId || !paymentType) {
            return res.status(400).json({ success: false, message: 'orderId and paymentType are required' });
        }

        if (paymentType === 'quick') {
            // CALL EXISTING FLOW (DO NOT CHANGE)
            console.log('[UnifiedPayment] Using legacy flow for quick commerce');
            let frontendUrl = process.env.FRONTEND_URL || 'https://laxmart.store';
            try {
                const originHeader = req.headers.origin || req.headers.referer;
                if (originHeader) {
                    const url = new URL(originHeader);
                    frontendUrl = url.origin;
                }
            } catch (err) {}
            frontendUrl = frontendUrl.replace(/\/$/, '');
            
            const result = await createPhonePeOrder(orderId, frontendUrl);
            return res.status(200).json(result);
        } else {
            // USE NEW PHONEPE FLOW (Uniform for ecommerce, hotel, bus)
            console.log(`[UnifiedPayment] Using new flow for ${paymentType}`);
            let frontendUrl = process.env.FRONTEND_URL || 'https://laxmart.store';
            try {
                const originHeader = req.headers.origin || req.headers.referer;
                if (originHeader) {
                    const url = new URL(originHeader);
                    frontendUrl = url.origin;
                }
            } catch (err) {}
            frontendUrl = frontendUrl.replace(/\/$/, '');

            const result = await createUnifiedPayment(orderId, paymentType, userId, frontendUrl);
            return res.status(200).json(result);
        }
    } catch (error: any) {
        console.error('[UnifiedPaymentController] create Error:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { merchantOrderId } = req.body;
        if (!merchantOrderId) {
            return res.status(400).json({ success: false, message: 'merchantOrderId is required' });
        }

        const result = await verifyUnifiedPaymentStatus(merchantOrderId);
        return res.status(200).json(result);
    } catch (error: any) {
        console.error('[UnifiedPaymentController] verify Error:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getStatus = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params; // This is merchantOrderId in the requested generic status API
        const result = await verifyUnifiedPaymentStatus(orderId);
        return res.status(200).json(result);
    } catch (error: any) {
        console.error('[UnifiedPaymentController] getStatus Error:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const callback = async (req: Request, res: Response) => {
    try {
        await handleUnifiedWebhook(req.body);
        return res.status(200).send('OK');
    } catch (error: any) {
        console.error('[UnifiedPaymentController] callback Error:', error.message);
        return res.status(200).send('OK'); // Always 200 for webhooks
    }
};
