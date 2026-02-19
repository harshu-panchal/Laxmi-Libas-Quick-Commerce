export interface DiscountRule {
    _id: string;
    minQty: number;
    discountPercent: number;
    categoryId?: string;
    sellerId?: string;
    productId?: string;
    isActive: boolean;
}

export const findBestRule = (
    rules: DiscountRule[],
    quantity: number,
    productId: string,
    sellerId?: string,
    categoryId?: string
): DiscountRule | null => {
    const applicableRules = rules.filter((r) => quantity >= r.minQty);

    if (applicableRules.length === 0) return null;

    // Categorize rules by priority
    const productRules = applicableRules.filter((r) => r.productId === productId);
    const sellerRules = applicableRules.filter(
        (r) => !r.productId && r.sellerId && sellerId && r.sellerId === sellerId
    );
    const categoryRules = applicableRules.filter(
        (r) => !r.productId && !r.sellerId && r.categoryId && categoryId && r.categoryId === categoryId
    );
    const globalRules = applicableRules.filter(
        (r) => !r.productId && !r.sellerId && !r.categoryId
    );

    // Apply priority: Product > Seller > Category > Global
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
};

export const calculateDiscountForItem = (
    price: number,
    quantity: number,
    rule: DiscountRule | null
) => {
    const subtotal = price * quantity;
    if (!rule) {
        return {
            discountPercent: 0,
            discountAmount: 0,
            finalPrice: subtotal,
        };
    }

    const discountAmount = (subtotal * rule.discountPercent) / 100;
    return {
        discountPercent: rule.discountPercent,
        discountAmount,
        finalPrice: subtotal - discountAmount,
        ruleId: rule._id,
    };
};
