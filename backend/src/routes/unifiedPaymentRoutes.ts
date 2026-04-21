import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createPayment, verifyPayment, getStatus, callback } from '../controllers/unifiedPaymentController';

const router = Router();

router.post('/create', authenticate, createPayment);
router.post('/verify', authenticate, verifyPayment);
router.get('/status/:orderId', authenticate, getStatus);
router.post('/callback', callback);

export default router;
