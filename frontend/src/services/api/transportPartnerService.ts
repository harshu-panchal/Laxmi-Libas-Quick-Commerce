import api from './config';
import { ApiResponse } from './orderService';

export interface Bus {
  _id: string;
  busName: string;
  busNumber: string;
  from: string;
  to: string;
  departureTime: string;
  status: string;
}

export interface BusBooking {
  _id: string;
  busId: any;
  userId: any;
  seats: string[];
  amount: number;
  status: 'Confirmed' | 'Boarded' | 'Completed' | 'Cancelled';
}

/**
 * Get buses owned by current seller
 */
export const getMyBuses = async (): Promise<ApiResponse<Bus[]>> => {
  const response = await api.get<ApiResponse<Bus[]>>('/bus/my-buses');
  return response.data;
};

/**
 * Get bookings for a specific bus
 */
export const getBusBookings = async (busId: string): Promise<ApiResponse<BusBooking[]>> => {
  const response = await api.get<ApiResponse<BusBooking[]>>(`/bus/${busId}/bookings`);
  return response.data;
};

/**
 * Update passenger booking status (Boarded, etc)
 */
export const updateBusBookingStatus = async (bookingId: string, status: string): Promise<ApiResponse<BusBooking>> => {
  const response = await api.patch<ApiResponse<BusBooking>>(`/bus/bookings/${bookingId}/status`, { status });
  return response.data;
};

/**
 * Download Manifest URL
 */
export const getManifestUrl = (busId: string, token: string | null) => {
  return `${import.meta.env.VITE_API_BASE_URL}/bus/${busId}/manifest?token=${token}`;
};
