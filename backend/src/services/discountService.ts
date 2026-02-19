import DiscountRule from '../models/DiscountRule';
import mongoose from 'mongoose';

interface DiscountCalculationInput {
    productId: string;
    categoryId?: string;
    sellerId?: string;
    quantity: number;
    price: number;
}

interface DiscountResult {
    discountPercent: number;
    discountAmount: number;
    finalPrice: number;
    appliedRuleId?: string;
    message?: string;
}

export class DiscountService {
    /**
     * Calculate discount for a single item
     */
    static async calculateDiscount(input: DiscountCalculationInput): Promise<DiscountResult> {
        const { productId, categoryId, sellerId, quantity, price } = input;

        // Fetch all potentially applicable rules
        const rules = await DiscountRule.find({
            isActive: true,
            minQty: { $lte: quantity },
            $or: [
                { productId: new mongoose.Types.ObjectId(productId) },
                { sellerId: sellerId ? new mongoose.Types.ObjectId(sellerId) : null },
                { categoryId: categoryId ? new mongoose.Types.ObjectId(categoryId) : null },
                { productId: null, sellerId: null, categoryId: null }, // Global rules
            ],
        }).lean();

        if (rules.length === 0) {
            return {
                discountPercent: 0,
                discountAmount: 0,
                finalPrice: price * quantity,
            };
        }

        // Find the best rule based on priority
        const bestRule = this.findBestRule(rules, quantity, productId, sellerId, categoryId);

        if (!bestRule) {
            return {
                discountPercent: 0,
                discountAmount: 0,
                finalPrice: price * quantity,
            };
        }

        // Calculate discount
        const subtotal = price * quantity;
        const discountAmount = (subtotal * bestRule.discountPercent) / 100;
        const finalPrice = subtotal - discountAmount;

        return {
            discountPercent: bestRule.discountPercent,
            discountAmount,
            finalPrice,
            appliedRuleId: bestRule._id.toString(),
            message: `${bestRule.discountPercent}% discount applied (${quantity} items)`,
        };
    }

    /**
     * Find the best discount rule based on priority system
     * Priority: Product > Seller > Category > Global
     */
    private static findBestRule(
        rules: any[],
        quantity: number,
        productId: string,
        sellerId?: string,
        categoryId?: string
    ): any | null {
        // Filter rules that match quantity requirement
        const applicableRules = rules.filter((r) => quantity >= r.minQty);

        if (applicableRules.length === 0) return null;

        // Categorize rules by priority
        const productRules = applicableRules.filter(
            (r) => r.productId && r.productId.toString() === productId
        );
        const sellerRules = applicableRules.filter(
            (r) => !r.productId && r.sellerId && sellerId && r.sellerId.toString() === sellerId
        );
        const categoryRules = applicableRules.filter(
            (r) => !r.productId && !r.sellerId && r.categoryId && categoryId && r.categoryId.toString() === categoryId
        );
        const globalRules = applicableRules.filter(
            (r) => !r.productId && !r.sellerId && !r.categoryId
        );

        // Apply priority: Product > Seller > Category > Global
        // Within each priority, choose the highest discount
        if (productRules.length > 0) {
            return productRules.reduce((best, current) =>
                current.discountPercent > best.discountPercent ? current : best
            );
        }

        if (sellerRules.length > 0) {
            return sellerRules.reduce((best, current) =>
                current.discountPercent > best.discountPercent ? current : best
            );
        }

        if (categoryRules.length > 0) {
            return categoryRules.reduce((best, current) =>
                current.discountPercent > best.discountPercent ? current : best
            );
        }

        if (globalRules.length > 0) {
            return globalRules.reduce((best, current) =>
                current.discountPercent > best.discountPercent ? current : best
            );
        }

        return null;
    }

    /**
     * Validate discount on order creation (backend validation)
     */
    static async validateOrderDiscount(
        items: Array<{
            productId: string;
            categoryId?: string;
            sellerId?: string;
            quantity: number;
            price: number;
            claimedDiscountPercent?: number;
            claimedDiscountAmount?: number;
        }>
    ): Promise<{ valid: boolean; message?: string; recalculatedTotal?: number }> {
        let totalRecalculated = 0;

        for (const item of items) {
            const calculated = await this.calculateDiscount({
                productId: item.productId,
                categoryId: item.categoryId,
                sellerId: item.sellerId,
                quantity: item.quantity,
                price: item.price,
            });

            // Check if claimed discount matches calculated discount
            if (item.claimedDiscountPercent && item.claimedDiscountPercent !== calculated.discountPercent) {
                return {
                    valid: false,
                    message: `Invalid discount for product ${item.productId}. Expected ${calculated.discountPercent}%, got ${item.claimedDiscountPercent}%`,
                };
            }

            totalRecalculated += calculated.finalPrice;
        }

        return {
            valid: true,
            recalculatedTotal: totalRecalculated,
        };
    }
}
