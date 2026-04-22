import { Router } from 'express';
import * as busController from './busController';
import { authenticate } from '../../middleware/auth';

const router = Router();

// --- Seller Routes (Accessible via /api/bus/...) ---
router.get('/my-buses', authenticate, busController.getSellerBuses);
router.post('/add', authenticate, busController.addBus);
router.get('/routes/all', authenticate, busController.getSellerRoutes);
router.post('/routes/add', authenticate, busController.addBusRoute);
router.get('/schedules/all', authenticate, busController.getSellerSchedules);
router.post('/schedules/add', authenticate, busController.addBusSchedule);

router.get('/:busId/bookings', authenticate, busController.getBusBookings);
router.patch('/bookings/:bookingId/status', authenticate, busController.updateBookingStatus);
router.get('/:busId/manifest', authenticate, busController.getManifest);

// --- Customer Routes ---
router.get('/', busController.searchBuses);
router.get('/bookings/:bookingId/ticket', authenticate, busController.getTicket);
router.post('/booking', authenticate, busController.createBusBooking);
router.get('/cities', busController.getBusCities); // Dynamic cities list
router.get('/my-bookings', authenticate, busController.getMyBookings);
router.get('/:id', busController.getScheduleDetail);

export default router;

