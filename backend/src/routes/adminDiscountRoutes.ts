import { Router } from 'express';
import { authenticate, requireUserType } from '../middleware/auth';
import * as discountController from '../modules/admin/controllers/adminDiscountController';

const router = Router();

// Routes for Discount Rules
router.post('/', authenticate, requireUserType('Admin'), discountController.createDiscountRule);
router.get('/', authenticate, requireUserType('Admin'), discountController.getDiscountRules);
router.put('/:id', authenticate, requireUserType('Admin'), discountController.updateDiscountRule);
router.delete('/:id', authenticate, requireUserType('Admin'), discountController.deleteDiscountRule);
router.patch('/:id/status', authenticate, requireUserType('Admin'), discountController.toggleDiscountRuleStatus);

export default router;
