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

export interface HotelRoom {
  _id: string;
  hotelId: string;
  roomType: string;
  basePrice: number;
  originalPrice: number;
  guestCapacity: number;
  totalRooms: number;
  availabilityStatus: 'Available' | 'Full' | 'Maintenance';
  amenities: string[];
}

/**
 * Get hotels owned by current seller
 */
export const getMyHotels = async (): Promise<ApiResponse<Hotel[]>> => {
  const response = await api.get<ApiResponse<Hotel[]>>('/hotel/my-hotels');
  return response.data;
};

/**
 * Get rooms for a specific hotel
 */
export const getHotelRooms = async (hotelId: string): Promise<ApiResponse<HotelRoom[]>> => {
  const response = await api.get<ApiResponse<HotelRoom[]>>(`/hotel/${hotelId}/rooms`);
  return response.data;
};

/**
 * Add a room to hotel
 */
export const addHotelRoom = async (roomData: any): Promise<ApiResponse<HotelRoom>> => {
    const { hotelId, ...data } = roomData;
    const response = await api.post<ApiResponse<HotelRoom>>(`/hotel/${hotelId}/rooms`, data);
    return response.data;
};

/**
 * Update room status
 */
export const updateHotelRoomStatus = async (roomId: string, status: string): Promise<ApiResponse<any>> => {
    const response = await api.patch<ApiResponse<any>>(`/hotel/rooms/${roomId}/status`, { status });
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

/**
 * Save Onboarding Step (Draft)
 */
export const saveOnboardingStep = async (data: any): Promise<ApiResponse<any>> => {
    const response = await api.post<ApiResponse<any>>('/hotel/save-onboarding', data);
    return response.data;
};

/**
 * Add a new hotel (direct)
 */
export const addHotel = async (hotelData: any): Promise<ApiResponse<Hotel>> => {
    const response = await api.post<ApiResponse<Hotel>>('/hotel/add', hotelData);
    return response.data;
};

/**
 * Update hotel details
 */
export const updateHotel = async (hotelId: string, hotelData: any): Promise<ApiResponse<Hotel>> => {
    const response = await api.put<ApiResponse<Hotel>>(`/hotel/${hotelId}`, hotelData);
    return response.data;
};

/**
 * Delete a hotel
 */
export const deleteHotel = async (hotelId: string): Promise<ApiResponse<any>> => {
    const response = await api.delete<ApiResponse<any>>(`/hotel/${hotelId}`);
    return response.data;
};
