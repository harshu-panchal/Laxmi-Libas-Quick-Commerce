import { Request, Response } from 'express';
import DiscountRule from '../../../models/DiscountRule';

// Create a new discount rule
export const createDiscountRule = async (req: Request, res: Response) => {
    try {
        const { minQty, discountPercent, categoryId, sellerId, productId } = req.body;

        // Basic validation
        if (!minQty || !discountPercent) {
            return res.status(400).json({ success: false, message: 'Minimum quantity and discount percent are required' });
        }

        const rule = new DiscountRule({
            minQty,
            discountPercent,
            categoryId: categoryId || null,
            sellerId: sellerId || null,
            productId: productId || null
        });

        await rule.save();
        return res.status(201).json({ success: true, data: rule });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get all discount rules
export const getDiscountRules = async (_req: Request, res: Response) => {
    try {
        const rules = await DiscountRule.find({})
            .populate('categoryId', 'name')
            .populate('sellerId', 'shopName name')
            .populate('productId', 'name')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: rules });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update a discount rule
export const updateDiscountRule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const rule = await DiscountRule.findByIdAndUpdate(id, req.body, { new: true });

        if (!rule) {
            return res.status(404).json({ success: false, message: 'Discount rule not found' });
        }

        return res.status(200).json({ success: true, data: rule });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a discount rule
export const deleteDiscountRule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await DiscountRule.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ success: false, message: 'Discount rule not found' });
        }

        return res.status(200).json({ success: true, message: 'Discount rule deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle active status
export const toggleDiscountRuleStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const rule = await DiscountRule.findById(id);

        if (!rule) {
            return res.status(404).json({ success: false, message: 'Discount rule not found' });
        }

        rule.isActive = !rule.isActive;
        await rule.save();

        return res.status(200).json({ success: true, data: rule });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
