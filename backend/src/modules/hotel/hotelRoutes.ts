import { Router } from 'express';
import { 
  addHotel, 
  addRoom, 
  getSellerHotels, 
  getHotelBookings,
  approveHotel,
  getAllBookings,
  getHotels,
  getHotelDetails,
  createBooking,
  updateBookingStatus,
  getStayInvoice
} from './hotelController';
import { authenticate, checkSellerAccess, checkPermission } from '../../middleware/auth';

console.log('DEBUG: hotelController imports', { addHotel, addRoom, getSellerHotels, getHotelBookings, approveHotel, getAllBookings, getHotels, getHotelDetails, createBooking, updateBookingStatus, getStayInvoice });
console.log('DEBUG: auth imports', { authenticate, checkSellerAccess, checkPermission });

const router = Router();

// Customer Routes
router.get('/', getHotels);
router.get('/:hotelId', getHotelDetails);
router.post('/booking', authenticate, createBooking);

// Seller Routes
router.post('/add', authenticate, checkSellerAccess('hotel'), addHotel);
router.post('/:hotelId/rooms', authenticate, checkSellerAccess('hotel'), addRoom);
router.get('/my-hotels', authenticate, checkSellerAccess('hotel'), getSellerHotels);
router.get('/:hotelId/bookings', authenticate, checkSellerAccess('hotel'), getHotelBookings);
router.patch('/bookings/:bookingId/status', authenticate, checkSellerAccess('hotel'), updateBookingStatus);
router.get('/bookings/:bookingId/invoice', authenticate, checkSellerAccess('hotel'), getStayInvoice);

// Admin Routes
router.patch('/:hotelId/approve', authenticate, checkPermission('hotel'), approveHotel);
router.get('/admin/bookings', authenticate, checkPermission('hotel'), getAllBookings);

export default router;
