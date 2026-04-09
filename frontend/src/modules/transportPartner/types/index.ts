export interface Bus {
  id: string;
  name: string;
  type: 'AC' | 'Non-AC' | 'Sleeper';
  totalSeats: number;
  registrationNumber: string;
  status: 'Active' | 'Inactive';
}

export interface BusRoute {
  id: string;
  from: string;
  to: string;
  distance?: number;
}

export interface Schedule {
  id: string;
  busId: string;
  routeId: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  busName?: string;
  from?: string;
  to?: string;
}

export interface Seat {
  id: number;
  number: string;
  isBooked: boolean;
}

export interface Booking {
  id: string;
  passengerName: string;
  busName: string;
  route: string;
  date: string;
  seatNumber: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  amount: number;
}

export interface MonthlyEarning {
  month: string;
  amount: number;
}

export interface DashboardStats {
  totalBuses: number;
  totalBookings: number;
  activeRoutes: number;
  revenue: number;
  recentBookings: Booking[];
}
