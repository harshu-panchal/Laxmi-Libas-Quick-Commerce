import { Router } from 'express';
import { 
  addBus, 
  getSellerBuses, 
  updateBusRoute, 
  getBusBookings,
  approveBus,
  getAllBusBookings,
  searchBuses,
  getBusDetails,
  createBusBooking,
  updateBusBookingStatus,
  getPassengerManifest
} from './busController';
import { authenticate, checkSellerAccess, checkPermission } from '../../middleware/auth';

const router = Router();

// Customer Routes
router.get('/', searchBuses);
router.get('/:busId', getBusDetails);
router.post('/booking', authenticate, createBusBooking);

// Seller Routes
router.post('/add', authenticate, checkSellerAccess('bus'), addBus);
router.get('/my-buses', authenticate, checkSellerAccess('bus'), getSellerBuses);
router.patch('/:busId/route', authenticate, checkSellerAccess('bus'), updateBusRoute);
router.get('/:busId/bookings', authenticate, checkSellerAccess('bus'), getBusBookings);
router.patch('/bookings/:bookingId/status', authenticate, checkSellerAccess('bus'), updateBusBookingStatus);
router.get('/:busId/manifest', authenticate, checkSellerAccess('bus'), getPassengerManifest);

// Admin Routes
router.patch('/:busId/approve', authenticate, checkPermission('bus'), approveBus);
router.get('/admin/bookings', authenticate, checkPermission('bus'), getAllBusBookings);

export default router;
