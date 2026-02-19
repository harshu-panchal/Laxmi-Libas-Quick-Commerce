import { Router } from 'express';
import { getActiveDiscounts } from '../modules/customer/controllers/customerDiscountController';

const router = Router();

router.get('/active', getActiveDiscounts);

export default router;
