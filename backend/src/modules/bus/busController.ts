import { Request, Response } from 'express';
import Bus from '../../models/Bus';
import BusRoute from '../../models/BusRoute';
import BusSchedule from '../../models/BusSchedule';
import BusBooking from '../../models/BusBooking';
import { PDFService } from '../../services/PDFService';
import { asyncHandler } from '../../utils/asyncHandler';
import mongoose from 'mongoose';
import { normalizeCity, calculateDistance } from '../../utils/locationUtils';
// --- Customer Features ---

/**
 * Search buses (schedules) between source and destination on a specific date
 */
export const searchBuses = asyncHandler(async (req: Request, res: Response) => {
  const { from, to, date, fromLat, fromLng, toLat, toLng } = req.query;


  if (!from && (!fromLat || !fromLng)) {
    res.status(400).json({ success: false, message: 'Source location is required' });
    return;
  }
  if (!to && (!toLat || !toLng)) {
    res.status(400).json({ success: false, message: 'Destination location is required' });
    return;
  }

  const query: any = { isActive: true };

  // Helper to escape regex special characters
  const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Search for "from"
  if (fromLat && fromLng) {
    query.fromLocationGeo = {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(fromLng), Number(fromLat)] },
        $maxDistance: 15000 // 15 km
      }
    };
  } else if (from) {
    query.from = new RegExp(escapeRegExp((from as string).trim()), 'i');
  }

  // Search for "to"
  if (toLat && toLng) {
    query.toLocationGeo = {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(toLng), Number(toLat)] },
        $maxDistance: 15000 // 15 km
      }
    };
  } else if (to) {
    query.to = new RegExp(escapeRegExp((to as string).trim()), 'i');
  }

  // 1. Find routes that match source and destination
  const routes = await BusRoute.find(query);

  if (routes.length === 0) {
    res.json({ success: true, data: [] });
    return;
  }

  const routeIds = routes.map(r => r._id);

  // 2. Find schedules for these routes
  const scheduleQuery: any = {
    routeId: { $in: routeIds },
    isActive: true
  };

  if (date) {
    const startOfDay = new Date(date as string);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date as string);
    endOfDay.setHours(23, 59, 59, 999);
    scheduleQuery.departureDate = { $gte: startOfDay, $lte: endOfDay };
  }

  const schedules = await BusSchedule.find(scheduleQuery)
    .populate('busId')
    .populate('routeId')
    .sort({ departureTime: 1 });

  // Transform for frontend if needed
  const formattedSchedules = schedules.map(s => {
    const bus = s.busId as any;
    const route = s.routeId as any;
    return {
      _id: s._id,
      operatorName: bus.operatorName,
      busName: bus.busName,
      busType: bus.busType,
      from: route.from,
      to: route.to,
      departureTime: s.departureTime,
      arrivalTime: s.arrivalTime,
      date: s.departureDate.toLocaleDateString(),
      basePrice: s.basePrice,
      amenities: bus.amenities,
      availableSeats: s.seats.filter(st => !st.isBooked).length
    };
  });

  res.json({ success: true, data: formattedSchedules });
});

/**
 * Get specific schedule detail (with seat map)
 */
export const getScheduleDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const schedule = await BusSchedule.findById(id)
    .populate('busId')
    .populate('routeId');

  if (!schedule) {
    res.status(404).json({ success: false, message: 'Schedule not found' });
    return;
  }

  const bus = schedule.busId as any;
  const route = schedule.routeId as any;

  const data = {
    _id: schedule._id,
    operatorName: bus.operatorName,
    date: schedule.departureDate.toLocaleDateString(),
    departureTime: schedule.departureTime,
    basePrice: schedule.basePrice,
    seats: schedule.seats,
    pickupPoints: route.pickupPoints,
    dropoffPoints: route.dropoffPoints,
    amenities: bus.amenities
  };

  res.json({ success: true, data });
});

/**
 * Get current user's bus bookings
 */
export const getMyBookings = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const bookings = await BusBooking.find({ userId })
    .populate({
      path: 'scheduleId',
      populate: [{ path: 'busId' }, { path: 'routeId' }]
    })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: bookings });
});

/**
 * Create Bus Booking (Initial lock)
 */
export const createBusBooking = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  console.log('[BusController] createBusBooking BODY:', req.body);
  const { scheduleId, seats, totalAmount, pickupPoint, dropoffPoint } = req.body;

  const schedule = await BusSchedule.findById(scheduleId);
  if (!schedule) {
    res.status(404).json({ success: false, message: 'Schedule not found' });
    return;
  }

  // Check if seats are still available
  const seatNumbersToBook = seats.map((s: any) => s.seatNumber);
  const alreadyBooked = schedule.seats.filter(s => s.isBooked && seatNumbersToBook.includes(s.seatNumber));

  if (alreadyBooked.length > 0) {
    res.status(400).json({ success: false, message: 'Some seats are already booked' });
    return;
  }

  // Create booking record
  const booking = new BusBooking({
    scheduleId,
    userId,
    seats,
    totalAmount,
    pickupPoint,
    dropoffPoint,
    status: 'LOCKED',
    paymentStatus: 'Pending',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 min lock
  });

  await booking.save();

  res.status(201).json({ success: true, data: booking });
});

export const getTicket = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const booking = await BusBooking.findById(bookingId)
    .populate({
        path: 'scheduleId',
        populate: [{ path: 'busId' }, { path: 'routeId' }]
    });

  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking not found' });
    return;
  }

  const pdfBuffer = await PDFService.generateBusTicket(booking);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=ticket-${bookingId}.pdf`);
  res.send(pdfBuffer);
});

// --- Seller Features ---

export const getSellerBuses = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;
  const buses = await Bus.find({ sellerId });
  res.json({ success: true, data: buses });
});

export const addBus = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;
  const bus = new Bus({ ...req.body, sellerId });
  await bus.save();
  res.status(201).json({ success: true, data: bus });
});

export const getBusBookings = asyncHandler(async (req: Request, res: Response) => {
  const { busId } = req.params;
  
  // Find all schedules for this bus
  const schedules = await BusSchedule.find({ busId }).distinct('_id');
  
  const bookings = await BusBooking.find({ scheduleId: { $in: schedules } })
    .populate('userId')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: bookings });
});

export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const { status } = req.body;

  const booking = await BusBooking.findByIdAndUpdate(bookingId, { status }, { new: true });
  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking not found' });
    return;
  }

  // If confirmed, update schedule seats
  if (status === 'confirmed') {
    const schedule = await BusSchedule.findById(booking.scheduleId);
    if (schedule) {
      const seatNums = booking.seats.map(s => s.seatNumber);
      schedule.seats = schedule.seats.map(s => {
        if (seatNums.includes(s.seatNumber)) {
          return { ...s, isBooked: true };
        }
        return s;
      });
      await schedule.save();
    }
  }

  res.json({ success: true, data: booking });
});

export const getManifest = asyncHandler(async (req: Request, res: Response) => {
  const { busId } = req.params;
  const bus = await Bus.findById(busId);
  if (!bus) {
    res.status(404).json({ success: false, message: 'Bus not found' });
    return;
  }

  const schedules = await BusSchedule.find({ busId }).distinct('_id');
  const bookings = await BusBooking.find({ scheduleId: { $in: schedules }, status: 'confirmed' }).populate('userId');

  const pdfBuffer = await PDFService.generateBusManifest(bus, bookings);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=manifest-${busId}.pdf`);
  res.send(pdfBuffer);
});

// Routes Management
export const getSellerRoutes = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;
  const routes = await BusRoute.find({ sellerId });
  res.json({ success: true, data: routes });
});

export const addBusRoute = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;
  const route = new BusRoute({ ...req.body, sellerId });
  await route.save();
  res.status(201).json({ success: true, data: route });
});

// Schedule Management
export const getSellerSchedules = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;
  const buses = await Bus.find({ sellerId }).distinct('_id');
  const schedules = await BusSchedule.find({ busId: { $in: buses } }).populate('busId routeId');
  res.json({ success: true, data: schedules });
});

export const addBusSchedule = asyncHandler(async (req: Request, res: Response) => {
  const schedule = new BusSchedule(req.body);
  await schedule.save();
  const populatedSchedule = await BusSchedule.findById(schedule._id).populate('busId routeId');
  res.status(201).json({ success: true, data: populatedSchedule });
});


/**
 * Get unique cities for bus search
 */
export const getBusCities = asyncHandler(async (_req: Request, res: Response) => {
  // Broaden city fetching to include all unique cities in the routes table
  const fromCities = await BusRoute.distinct('from');
  const toCities = await BusRoute.distinct('to');
  
  const allCities = [...new Set([...fromCities, ...toCities])].filter(Boolean).sort();
  
  res.json({
    success: true,
    data: allCities
  });
});
