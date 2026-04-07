import api from './config';

/**
 * Create PhonePe order for payment
 */
export const createPhonePeOrder = async (orderId: string, amount?: number) => {
    try {
        const response = await api.post('/payment/phonepe/create', { orderId, amount });
        return response.data;
    } catch (error: any) {
        console.error('Error creating PhonePe order:', error);
        throw error;
    }
};

/**
 * Get Payment Status
 */
export const checkPhonePePaymentStatus = async (merchantTransactionId: string) => {
    try {
        const response = await api.get(`/payment/phonepe/status/${merchantTransactionId}`);
        return response.data;
    } catch (error: any) {
        console.error('Error getting PhonePe payment status:', error);
        throw error;
    }
};

/**
 * Get payment history (if needed)
 */
export const getPaymentHistory = async () => {
    try {
        const response = await api.get('/customer/payments');
        return response.data;
    } catch (error: any) {
        console.error('Error getting payment history:', error);
        throw error;
    }
};
