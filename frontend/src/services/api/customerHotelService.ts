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

export const getMyHotelBookings = async () => {
    const response = await axiosInstance.get('/hotel/my-bookings');
    return response.data;
};

export const getCurrentLocation = async () => {
    const response = await axiosInstance.get('/hotel/location/current');
    return response.data;
};

export const toggleSavedHotel = async (hotelId: string) => {
    const response = await axiosInstance.post(`/customer/saved-hotels/${hotelId}`);
    return response.data;
};

export const getHotelCities = async () => {
    const response = await axiosInstance.get('/hotel/cities');
    return response.data;
};
