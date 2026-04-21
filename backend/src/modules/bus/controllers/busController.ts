import { Request, Response } from 'express';
import Bus from '../../../models/Bus';
import BusBooking from '../../../models/BusBooking';
import { asyncHandler } from '../../../utils/asyncHandler';

/**
 * Add a new bus (Seller only)
 */
export const addBus = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;
  const { busName, from, to, departureTime, price, totalSeats } = req.body;

  const bus = await Bus.create({
    sellerId,
    busName,
    from,
    to,
    departureTime,
    price,
    totalSeats,
    availableSeats: totalSeats,
  });

  res.status(201).json({
    success: true,
    message: 'Bus added successfully',
    data: bus,
  });
});

/**
 * Get all buses with optional filters
 */
export const getBuses = asyncHandler(async (req: Request, res: Response) => {
  const { from, to, date } = req.query;
  const query: any = { status: 'active' };

  if (from) query.from = { $regex: new RegExp(from as string, 'i') };
  if (to) query.to = { $regex: new RegExp(to as string, 'i') };
  if (date) {
    const start = new Date(date as string);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date as string);
    end.setHours(23, 59, 59, 999);
    query.departureTime = { $gte: start, $lte: end };
  }

  const buses = await Bus.find(query).sort({ departureTime: 1 });

  res.status(200).json({
    success: true,
    data: buses,
  });
});

/**
 * Get seller's buses
 */
export const getSellerBuses = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;
  const buses = await Bus.find({ sellerId }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: buses,
  });
});

/**
 * Book a bus seat (User only)
 */
export const bookBus = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { busId, seats } = req.body;

  const bus = await Bus.findById(busId);
  if (!bus) {
    return res.status(404).json({ success: false, message: 'Bus not found' });
  }

  if (bus.availableSeats < seats) {
    return res.status(400).json({ success: false, message: 'Not enough seats available' });
  }

  const totalPrice = bus.price * seats;

  const booking = await BusBooking.create({
    busId,
    userId,
    seats,
    totalPrice,
  });

  // Update available seats
  bus.availableSeats -= seats;
  await bus.save();

  res.status(201).json({
    success: true,
    message: 'Bus booked successfully',
    data: booking,
  });
});
