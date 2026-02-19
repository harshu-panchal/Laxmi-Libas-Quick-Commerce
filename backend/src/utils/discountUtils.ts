
import DiscountRule from '../../models/DiscountRule';

export const calculateDiscount = async (item: any) => {
    // This function is for a single item context, 
    // but in reality we need to fetch rules first.
    // Efficiently, we should fetch all potentially relevant rules for the whole cart
    // to avoid N+1 queries. 
    // But for now, let's assume we fetch rules based on item details.

    // In a real app, this should be optimized.
    // For this implementation, I will implement a bulk calculator in the controller/service.
    return 0;
};

export const findBestRule = (rules: any[], qty: number) => {
    // Filter by quantity
    const applicable = rules.filter(r => qty >= r.minQty);
    if (applicable.length === 0) return null;

    // specific logic: priorities are Product > Seller > Category > Global
    // We assume 'rules' passed here are already mixed.
    // We can interpret the rule specificity based on fields present.
    // Product rule has productId.
    // Seller rule has sellerId (and no productId).
    // Category rule has categoryId (and no product/seller).
    // Global has none.

    // Sort by priority group, then by discount percent desc
    applicable.sort((a, b) => {
        const getScore = (r: any) => {
            if (r.productId) return 4;
            if (r.sellerId) return 3;
            if (r.categoryId) return 2;
            return 1; // Global
        };

        const scoreA = getScore(a);
        const scoreB = getScore(b);

        if (scoreA !== scoreB) return scoreB - scoreA; // Descending priority
        return b.discountPercent - a.discountPercent; // Descending discount
    });

    return applicable[0];
};
