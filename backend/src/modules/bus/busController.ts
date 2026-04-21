import { Request, Response } from 'express';
import Bus from '../../models/Bus';
import BusBooking from '../../models/BusBooking';
import { PDFService } from '../../services/PDFService';
import { asyncHandler } from '../../utils/asyncHandler';

// --- Seller Features ---

export const addBus = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).user.userId;
    const bus = new Bus({ ...req.body, sellerId });
    await bus.save();
    res.status(201).json({ success: true, data: bus });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSellerBuses = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).user.userId;
    const buses = await Bus.find({ sellerId });
    res.json({ success: true, data: buses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBusRoute = async (req: Request, res: Response) => {
  try {
    const { busId } = req.params;
    const bus = await Bus.findByIdAndUpdate(busId, req.body, { new: true });
    res.json({ success: true, data: bus });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBusBookings = async (req: Request, res: Response) => {
  try {
    const { busId } = req.params;
    const bookings = await BusBooking.find({ busId }).populate('userId');
    res.json({ success: true, data: bookings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Customer Features ---

export const searchBuses = async (req: Request, res: Response) => {
  try {
    const { from, to, date } = req.query;
    const query: any = { status: 'Approved' };

    if (from) query['route.from'] = new RegExp(from as string, 'i');
    if (to)   query['route.to']   = new RegExp(to   as string, 'i');

    // Filter by exact calendar day: from startOfDay to endOfDay (local time)
    if (date) {
      const startOfDay = new Date(date as string);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date as string);
      endOfDay.setHours(23, 59, 59, 999);
      query['departureTime'] = { $gte: startOfDay, $lte: endOfDay };
    }

    const buses = await Bus.find(query).sort({ departureTime: 1 });
    res.json({ success: true, data: buses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBusDetails = async (req: Request, res: Response) => {
  try {
    const { busId } = req.params;
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });
    res.json({ success: true, data: bus });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBusBooking = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { busId, seats, totalAmount, passengerDetails } = req.body;

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });

    // Validate seats
    const bookedSeats = await BusBooking.find({ busId, status: { $ne: 'Cancelled' } }).distinct('seats');
    const isAnySeatTaken = seats.some((s: string) => bookedSeats.includes(s));
    
    if (isAnySeatTaken) {
      return res.status(400).json({ success: false, message: 'One or more seats already booked' });
    }

    const booking = new BusBooking({
      userId,
      busId,
      seats,
      amount: totalAmount,
      passengerDetails,
      status: 'Pending'
    });

    await booking.save();
    res.status(201).json({ success: true, data: booking });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Admin Features ---

export const approveBus = async (req: Request, res: Response) => {
  try {
    const { busId } = req.params;
    const { status } = req.body;
    const bus = await Bus.findByIdAndUpdate(busId, { status }, { new: true });
    res.json({ success: true, data: bus });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBusBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await BusBooking.find().populate('busId userId');
    res.json({ success: true, data: bookings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Professional Bus Booking Status Update
 */
export const updateBusBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const { status } = req.body; // Confirmed | Boarded | Completed | Cancelled

  const booking = await BusBooking.findById(bookingId);
  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking not found' });
    return;
  }

  booking.status = status;
  await booking.save();

  res.json({ success: true, message: `Passenger status updated to ${status}`, data: booking });
});

/**
 * Generate Passenger Manifest PDF
 */
export const getPassengerManifest = asyncHandler(async (req: Request, res: Response) => {
  const { busId } = req.params;

  const bus = await Bus.findById(busId);
  if (!bus) {
    res.status(404).json({ success: false, message: 'Bus not found' });
    return;
  }

  const bookings = await BusBooking.find({ busId }).populate('userId');

  const pdfBuffer = await PDFService.generateBusManifest(bus, bookings);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Manifest-${busId}.pdf`);
  res.send(pdfBuffer);
});
