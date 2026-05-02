import api from './config';

export const getOrderTracking = async (orderId: string) => {
  const response = await api.get(`/customer/orders/${orderId}/tracking`);
  return response.data;
};

export const getSellerLocations = async (orderId: string) => {
  const response = await api.get(`/customer/orders/${orderId}/seller-locations`);
  return response.data;
};
