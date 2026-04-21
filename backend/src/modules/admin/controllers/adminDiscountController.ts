import { Request, Response } from 'express';
import DiscountRule from '../../../models/DiscountRule';
import { asyncHandler } from '../../../utils/asyncHandler';

/**
 * @description Create a new discount rule with optional expiry and usage limits
 */
export const createDiscountRule = asyncHandler(async (req: Request, res: Response) => {
    const { 
        minQty, 
        discountPercent, 
        categoryId, 
        sellerId, 
        productId,
        startDate,
        expiryDate,
        usageLimit
    } = req.body;

    // Advanced validation
    if (minQty && minQty < 1) {
        return res.status(400).json({ success: false, message: 'Minimum quantity must be at least 1' });
    }
    
    if (discountPercent < 0 || discountPercent > 100) {
        return res.status(400).json({ success: false, message: 'Discount percent must be between 0 and 100' });
    }

    if (expiryDate && new Date(expiryDate) < new Date(startDate || Date.now())) {
        return res.status(400).json({ success: false, message: 'Expiry date cannot be before start date' });
    }

    const rule = new DiscountRule({
        minQty: minQty || 1,
        discountPercent,
        categoryId: categoryId || null,
        sellerId: sellerId || null,
        productId: productId || null,
        startDate: startDate || new Date(),
        expiryDate: expiryDate || null,
        usageLimit: usageLimit || 0
    });

    await rule.save();
    return res.status(201).json({ success: true, message: 'Discount rule created successfully', data: rule });
});

/**
 * @description Get all discount rules with detailed population
 */
export const getDiscountRules = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.query;
    const query: any = {};

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const rules = await DiscountRule.find(query)
        .populate('categoryId', 'name image')
        .populate('sellerId', 'storeName sellerName mobile')
        .populate('productId', 'productName mainImage price')
        .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: rules });
});

/**
 * @description Update existing discount rule
 */
export const updateDiscountRule = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.discountPercent !== undefined && (updateData.discountPercent < 0 || updateData.discountPercent > 100)) {
        return res.status(400).json({ success: false, message: 'Discount percent must be between 0 and 100' });
    }

    const rule = await DiscountRule.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!rule) {
        return res.status(404).json({ success: false, message: 'Discount rule not found' });
    }

    return res.status(200).json({ success: true, message: 'Discount rule updated successfully', data: rule });
});

/**
 * @description Delete discount rule
 */
export const deleteDiscountRule = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await DiscountRule.findByIdAndDelete(id);

    if (!result) {
        return res.status(404).json({ success: false, message: 'Discount rule not found' });
    }

    return res.status(200).json({ success: true, message: 'Discount rule deleted successfully' });
});

/**
 * @description Toggle active/inactive status
 */
export const toggleDiscountRuleStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const rule = await DiscountRule.findById(id);

    if (!rule) {
        return res.status(404).json({ success: false, message: 'Discount rule not found' });
    }

    rule.isActive = !rule.isActive;
    await rule.save();

    return res.status(200).json({ 
        success: true, 
        message: `Discount rule ${rule.isActive ? 'activated' : 'deactivated'} successfully`, 
        data: rule 
    });
});
