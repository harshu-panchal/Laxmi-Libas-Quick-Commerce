import axiosInstance from './config';

export const getHotels = async (params: any = {}) => {
  const response = await axiosInstance.get('/hotel', { params });
  return response.data;
};

export const getHotelDetails = async (hotelId: string) => {
  const response = await axiosInstance.get(`/hotel/${hotelId}`);
  return response.data;
};

export const createHotelBooking = async (bookingData: any) => {
  const response = await axiosInstance.post('/hotel/booking', bookingData);
  return response.data;
};
