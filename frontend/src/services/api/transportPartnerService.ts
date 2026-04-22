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
 * Add a new bus
 */
export const addBus = async (busData: any): Promise<ApiResponse<Bus>> => {
  const response = await api.post<ApiResponse<Bus>>('/bus/add', busData);
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
 * Get all routes for seller
 */
export const getSellerRoutes = async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get<ApiResponse<any[]>>('/bus/routes/all');
    return response.data;
};

/**
 * Add new route
 */
export const addBusRoute = async (routeData: any): Promise<ApiResponse<any>> => {
    const response = await api.post<ApiResponse<any>>('/bus/routes/add', routeData);
    return response.data;
};

/**
 * Get all schedules for seller
 */
export const getSellerSchedules = async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get<ApiResponse<any[]>>('/bus/schedules/all');
    return response.data;
};

/**
 * Add new schedule
 */
export const addBusSchedule = async (scheduleData: any): Promise<ApiResponse<any>> => {
    const response = await api.post<ApiResponse<any>>('/bus/schedules/add', scheduleData);
    return response.data;
};

/**
 * Download Manifest URL
 */
export const getManifestUrl = (busId: string, token: string | null) => {
  return `${import.meta.env.VITE_API_BASE_URL}/bus/${busId}/manifest?token=${token}`;
};
