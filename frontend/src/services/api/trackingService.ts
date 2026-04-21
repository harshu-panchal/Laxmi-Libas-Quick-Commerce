import { get } from './apiClient';

export const getOrderTracking = async (orderId: string) => {
  return get(`/customer/orders/${orderId}/tracking`);
};

export const getSellerLocations = async (orderId: string) => {
  return get(`/customer/orders/${orderId}/seller-locations`);
};
