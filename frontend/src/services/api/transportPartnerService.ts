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

/**
 * Get Bus Partner Wallet Stats
 */
export const getBusWalletStats = async (): Promise<ApiResponse<any>> => {
  try {
    const response = await api.get<ApiResponse<any>>('/bus/wallet/stats');
    return response.data;
  } catch (error) {
    return { success: false, data: { availableBalance: 0, totalEarnings: 0, pendingSettlement: 0, totalWithdrawn: 0 }, message: 'Failed to fetch wallet stats' } as any;
  }
};

/**
 * Get Bus Partner Wallet Transactions
 */
export const getBusWalletTransactions = async (): Promise<ApiResponse<any[]>> => {
  try {
    const response = await api.get<ApiResponse<any[]>>('/bus/wallet/transactions');
    return response.data;
  } catch (error) {
    return { success: false, data: [], message: 'Failed to fetch transactions' } as any;
  }
};

/**
 * Get Bus Partner Withdrawal Requests
 */
export const getBusWithdrawalRequests = async (): Promise<ApiResponse<any[]>> => {
  try {
    const response = await api.get<ApiResponse<any[]>>('/bus/wallet/withdrawals');
    return response.data;
  } catch (error) {
    return { success: false, data: [], message: 'Failed to fetch withdrawals' } as any;
  }
};

/**
 * Create Bus Partner Withdrawal Request
 */
export const createBusWithdrawalRequest = async (data: { amount: number; accountDetails: string; paymentMethod: string }): Promise<ApiResponse<any>> => {
  const response = await api.post<ApiResponse<any>>('/bus/wallet/withdraw', data);
  return response.data;
};

