import { Router } from 'express';
import { 
  addHotel, 
  updateHotel,
  deleteHotel,
  addRoom, 
  getHotelRooms,
  updateRoomStatus,
  getSellerHotels, 
  getHotelBookings,
  approveHotel,
  getAllBookings,
  getHotels,
  getHotelDetails,
  createBooking,
  getMyBookings,
  updateBookingStatus,
  getStayInvoice,
  saveOnboardingStep,
  getCurrentLocation,
  getHotelCities,
  getHotelWalletStats,
  getHotelWalletTransactions,
  getHotelWithdrawalRequests,
  createHotelWithdrawalRequest
} from './hotelController';
import { authenticate, checkSellerAccess, checkPermission } from '../../middleware/auth';

const router = Router();

// ⚠️ IMPORTANT: Static routes MUST come before dynamic /:hotelId routes in Express!

// --- Static customer routes ---
router.get('/', getHotels);
router.get('/location/current', getCurrentLocation);
router.post('/booking', authenticate, createBooking);
router.get('/my-bookings', authenticate, getMyBookings);
router.get('/cities', getHotelCities);

// --- Static seller/partner routes (MUST be before /:hotelId) ---
router.get('/my-hotels', authenticate, checkSellerAccess('hotel'), getSellerHotels);
router.post('/save-onboarding', authenticate, checkSellerAccess('hotel'), saveOnboardingStep);
router.post('/add', authenticate, checkSellerAccess('hotel'), addHotel);
router.patch('/rooms/:roomId/status', authenticate, checkSellerAccess('hotel'), updateRoomStatus);
router.patch('/bookings/:bookingId/status', authenticate, checkSellerAccess('hotel'), updateBookingStatus);
router.get('/bookings/:bookingId/invoice', authenticate, checkSellerAccess('hotel'), getStayInvoice);

// --- Hotel Partner Wallet Routes ---
router.get('/wallet/stats', authenticate, checkSellerAccess('hotel'), getHotelWalletStats);
router.get('/wallet/transactions', authenticate, checkSellerAccess('hotel'), getHotelWalletTransactions);
router.get('/wallet/withdrawals', authenticate, checkSellerAccess('hotel'), getHotelWithdrawalRequests);
router.post('/wallet/withdraw', authenticate, checkSellerAccess('hotel'), createHotelWithdrawalRequest);

// --- Static admin routes (MUST be before /:hotelId) ---
router.get('/admin/all', authenticate, checkPermission('hotel'), getHotels);
router.get('/admin/bookings', authenticate, checkPermission('hotel'), getAllBookings);

// --- Dynamic routes with /:hotelId (MUST come last) ---
router.get('/:hotelId', getHotelDetails);
router.put('/:hotelId', authenticate, checkSellerAccess('hotel'), updateHotel);
router.delete('/:hotelId', authenticate, checkSellerAccess('hotel'), deleteHotel);
router.get('/:hotelId/rooms', authenticate, checkSellerAccess('hotel'), getHotelRooms);
router.post('/:hotelId/rooms', authenticate, checkSellerAccess('hotel'), addRoom);
router.get('/:hotelId/bookings', authenticate, checkSellerAccess('hotel'), getHotelBookings);
router.patch('/:hotelId/approve', authenticate, checkPermission('hotel'), approveHotel);

export default router;
