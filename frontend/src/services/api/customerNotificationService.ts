import axiosInstance from './config';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'Info' | 'Success' | 'Warning' | 'Error' | 'Order' | 'Payment' | 'System';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export const getNotifications = async () => {
  const response = await axiosInstance.get('/customer/notifications');
  return response.data;
};

export const markAsRead = async (id: string) => {
  const response = await axiosInstance.post(`/customer/notifications/${id}/read`, {});
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await axiosInstance.post('/customer/notifications/read-all', {});
  return response.data;
};
