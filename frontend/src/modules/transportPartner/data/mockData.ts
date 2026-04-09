import { Bus, BusRoute, Schedule, Booking, MonthlyEarning, DashboardStats } from '../types';

export const mockBuses: Bus[] = [
  {
    id: '1',
    name: 'Laxmi Express',
    type: 'AC',
    totalSeats: 36,
    registrationNumber: 'RJ-14-PB-1234',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Royal Sleeper',
    type: 'Sleeper',
    totalSeats: 30,
    registrationNumber: 'GJ-01-RS-5678',
    status: 'Active',
  },
  {
    id: '3',
    name: 'City Connect',
    type: 'Non-AC',
    totalSeats: 40,
    registrationNumber: 'MP-04-CC-9012',
    status: 'Active',
  }
];

export const mockRoutes: BusRoute[] = [
  { id: 'r1', from: 'Ahmedabad', to: 'Mumbai', distance: 530 },
  { id: 'r2', from: 'Jaipur', to: 'Delhi', distance: 280 },
  { id: 'r3', from: 'Indore', to: 'Pune', distance: 590 },
  { id: 'r4', from: 'Surat', to: 'Ahmedabad', distance: 260 },
];

export const mockSchedules: Schedule[] = [
  {
    id: 's1',
    busId: '1',
    routeId: 'r1',
    date: '2024-05-10',
    departureTime: '22:00',
    arrivalTime: '06:00',
    busName: 'Laxmi Express',
    from: 'Ahmedabad',
    to: 'Mumbai',
  },
  {
    id: 's2',
    busId: '2',
    routeId: 'r2',
    date: '2024-05-11',
    departureTime: '21:30',
    arrivalTime: '05:30',
    busName: 'Royal Sleeper',
    from: 'Jaipur',
    to: 'Delhi',
  }
];

export const mockBookings: Booking[] = [
  {
    id: 'BK001',
    passengerName: 'Ankit Sharma',
    busName: 'Laxmi Express',
    route: 'Ahmedabad to Mumbai',
    date: '2024-05-10',
    seatNumber: 'A1',
    status: 'Confirmed',
    amount: 1250,
  },
  {
    id: 'BK002',
    passengerName: 'Rohit Verma',
    busName: 'Royal Sleeper',
    route: 'Jaipur to Delhi',
    date: '2024-05-11',
    seatNumber: 'S5',
    status: 'Confirmed',
    amount: 1500,
  },
  {
    id: 'BK003',
    passengerName: 'Sneha Gupta',
    busName: 'City Connect',
    route: 'Indore to Pune',
    date: '2024-05-12',
    seatNumber: 'B12',
    status: 'Pending',
    amount: 950,
  }
];

export const mockMonthlyEarnings: MonthlyEarning[] = [
  { month: 'Jan', amount: 85000 },
  { month: 'Feb', amount: 92000 },
  { month: 'Mar', amount: 78000 },
  { month: 'Apr', amount: 110000 },
  { month: 'May', amount: 125000 },
];

export const mockDashboardStats: DashboardStats = {
  totalBuses: 3,
  totalBookings: 450,
  activeRoutes: 4,
  revenue: 575000,
  recentBookings: mockBookings.slice(0, 3),
};
