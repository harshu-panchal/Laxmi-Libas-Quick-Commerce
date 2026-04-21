import api from './config';
import { ApiResponse } from './orderService';

export interface Hotel {
  _id: string;
  name: string;
  address: string;
  city: string;
  status: string;
  mainImage: string;
}

export interface HotelBooking {
  _id: string;
  hotelId: any;
  roomId: any;
  userId: any;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  paymentStatus: string;
  bookingStatus: 'LOCKED' | 'Confirmed' | 'Cancelled' | 'CheckedIn' | 'CheckedOut';
}

/**
 * Get hotels owned by current seller
 */
export const getMyHotels = async (): Promise<ApiResponse<Hotel[]>> => {
  const response = await api.get<ApiResponse<Hotel[]>>('/hotel/my-hotels');
  return response.data;
};

/**
 * Get bookings for a specific hotel
 */
export const getHotelBookings = async (hotelId: string): Promise<ApiResponse<HotelBooking[]>> => {
  const response = await api.get<ApiResponse<HotelBooking[]>>(`/hotel/${hotelId}/bookings`);
  return response.data;
};

/**
 * Update booking status (Check-in, Check-out, etc)
 */
export const updateHotelBookingStatus = async (bookingId: string, status: string): Promise<ApiResponse<HotelBooking>> => {
  const response = await api.patch<ApiResponse<HotelBooking>>(`/hotel/bookings/${bookingId}/status`, { status });
  return response.data;
};

/**
 * Download Stay Invoice URL
 */
export const getStayInvoiceUrl = (bookingId: string, token: string | null) => {
  return `${import.meta.env.VITE_API_BASE_URL}/hotel/bookings/${bookingId}/invoice?token=${token}`;
};
