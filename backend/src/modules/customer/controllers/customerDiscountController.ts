import { Request, Response } from 'express';
import DiscountRule from '../../../models/DiscountRule';

// Get all active discount rules
export const getActiveDiscounts = async (_req: Request, res: Response) => {
    try {
        const rules = await DiscountRule.find({ isActive: true })
            .select('minQty discountPercent categoryId sellerId productId')
            .lean();

        return res.status(200).json({ success: true, data: rules });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
