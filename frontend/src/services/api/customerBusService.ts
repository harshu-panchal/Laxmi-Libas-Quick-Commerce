import axiosInstance from './config';

export const searchBuses = async (params: any = {}) => {
  const response = await axiosInstance.get('/bus', { params });
  return response.data;
};

export const getScheduleDetail = async (busId: string) => {
  const response = await axiosInstance.get(`/bus/${busId}`);
  return response.data;
};

export const createBusBooking = async (bookingData: any) => {
  const response = await axiosInstance.post('/bus/booking', bookingData);
  return response.data;
};

export const getBusCities = async () => {
  const response = await axiosInstance.get('/bus/cities');
  return response.data;
};
export const getMyBusBookings = async () => {
  const response = await axiosInstance.get('/bus/my-bookings');
  return response.data;
};
