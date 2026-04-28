import { Router } from 'express';
import { handleCourierWebhook } from '../controllers/webhookController';

const router = Router();

/**
 * Public Webhook endpoint for Courier service (Delhivery)
 * Security is handled via X-Api-Key header or IP whitelisting
 */
router.post('/courier', handleCourierWebhook);

export default router;
