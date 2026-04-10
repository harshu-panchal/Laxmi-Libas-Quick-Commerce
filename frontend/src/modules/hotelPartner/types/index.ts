export interface Hotel {
  id: string;
  name: string;
  location: string;
  description: string;
  amenities: string[];
  images: string[];
  rating: number;
  reviewsCount: number;
  status: 'Active' | 'Inactive';
}

export interface Room {
  id: string;
  hotelId: string;
  type: string;
  pricePerNight: number;
  capacity: number;
  availability: boolean;
  image?: string;
}

export interface Booking {
  id: string;
  guestName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  totalAmount: number;
}

export interface MonthlyEarning {
  month: string;
  amount: number;
}

export interface DashboardStats {
  totalHotels: number;
  totalBookings: number;
  totalRevenue: number;
  recentBookings: Booking[];
}
