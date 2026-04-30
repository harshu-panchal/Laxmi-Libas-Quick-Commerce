import axiosInstance from './config';

export const getAdminAnalytics = async (period: string) => {
  try {
    const response = await axiosInstance.get(`/admin/analytics?period=${period}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const getSellerAnalytics = async (period: string) => {
  try {
    const response = await axiosInstance.get(`/seller/dashboard/analytics?period=${period}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};
