import api from './config';
import { DiscountRule } from '../../utils/discountFrontendUtils';

export interface DiscountResponse {
    success: boolean;
    data: DiscountRule[];
}

/**
 * Get all active discount rules for customers
 */
export const getActiveDiscounts = async (): Promise<DiscountResponse> => {
    const response = await api.get<DiscountResponse>('/customer/discounts/active');
    return response.data;
};
