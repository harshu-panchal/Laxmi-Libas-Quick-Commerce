import { Hotel, Room, Booking, MonthlyEarning, DashboardStats } from '../types';

export const mockHotels: Hotel[] = [
  {
    id: '1',
    name: 'Royal Heritage Resort',
    location: 'Udaipur, Rajasthan',
    description: 'A luxurious resort with lake views and premium amenities.',
    amenities: ['Pool', 'Spa', 'Free WiFi', 'Restaurant', 'Gym'],
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000'],
    rating: 4.8,
    reviewsCount: 124,
    status: 'Active',
  },
  {
    id: '2',
    name: 'Mountain View Inn',
    location: 'Manali, Himachal Pradesh',
    description: 'Cozy stay in the heart of the mountains.',
    amenities: ['Fireplace', 'Free WiFi', 'Trekking Tours'],
    images: ['https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=1000'],
    rating: 4.5,
    reviewsCount: 89,
    status: 'Active',
  }
];

export const mockRooms: Room[] = [
  {
    id: 'r1',
    hotelId: '1',
    type: 'Deluxe Suite',
    pricePerNight: 8500,
    capacity: 2,
    availability: true,
  },
  {
    id: 'r2',
    hotelId: '1',
    type: 'Family Villa',
    pricePerNight: 15000,
    capacity: 4,
    availability: true,
  },
  {
    id: 'r3',
    hotelId: '2',
    type: 'Standard Room',
    pricePerNight: 3500,
    capacity: 2,
    availability: false,
  }
];

export const mockBookings: Booking[] = [
  {
    id: 'B001',
    guestName: 'Anshul Sharma',
    roomType: 'Deluxe Suite',
    checkIn: '2024-05-10',
    checkOut: '2024-05-12',
    status: 'Confirmed',
    totalAmount: 17000,
  },
  {
    id: 'B002',
    guestName: 'Priya Verma',
    roomType: 'Family Villa',
    checkIn: '2024-05-15',
    checkOut: '2024-05-18',
    status: 'Pending',
    totalAmount: 45000,
  },
  {
    id: 'B003',
    guestName: 'Rahul Gupta',
    roomType: 'Deluxe Suite',
    checkIn: '2024-05-20',
    checkOut: '2024-05-22',
    status: 'Confirmed',
    totalAmount: 17000,
  }
];

export const mockMonthlyEarnings: MonthlyEarning[] = [
  { month: 'Jan', amount: 45000 },
  { month: 'Feb', amount: 52000 },
  { month: 'Mar', amount: 48000 },
  { month: 'Apr', amount: 61000 },
  { month: 'May', amount: 75000 },
];

export const mockDashboardStats: DashboardStats = {
  totalHotels: 2,
  totalBookings: 128,
  totalRevenue: 345000,
  recentBookings: mockBookings,
};
