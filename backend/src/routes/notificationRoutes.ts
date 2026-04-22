import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead 
} from '../modules/customer/controllers/notificationController';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);

export default router;
