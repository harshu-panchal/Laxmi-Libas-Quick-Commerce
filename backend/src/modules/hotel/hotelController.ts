import { Request, Response } from 'express';
import Hotel from '../../models/Hotel';
import HotelRoom from '../../models/HotelRoom';
import HotelBooking from '../../models/HotelBooking';
import { PDFService } from '../../services/PDFService';
import { asyncHandler } from '../../utils/asyncHandler';

// --- Seller Features ---

export const addHotel = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).user.userId;
    const hotel = new Hotel({ ...req.body, sellerId });
    await hotel.save();
    res.status(201).json({ success: true, data: hotel });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addRoom = async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const room = new HotelRoom({ ...req.body, hotelId });
    await room.save();
    res.status(201).json({ success: true, data: room });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSellerHotels = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).user.userId;
    const hotels = await Hotel.find({ sellerId });
    res.json({ success: true, data: hotels });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHotelBookings = async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const bookings = await HotelBooking.find({ hotelId }).populate('roomId userId');
    res.json({ success: true, data: bookings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Customer Features ---

export const getHotels = async (req: Request, res: Response) => {
  try {
    const { city, search } = req.query;
    const query: any = { status: 'Approved' };
    
    if (city) query.city = new RegExp(city as string, 'i');
    if (search) query.name = new RegExp(search as string, 'i');

    const hotels = await Hotel.find(query);
    res.json({ success: true, data: hotels });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHotelDetails = async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    
    const rooms = await HotelRoom.find({ hotelId, status: 'Available' });
    res.json({ success: true, data: { hotel, rooms } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBooking = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { hotelId, roomId, checkIn, checkOut, guests, totalAmount } = req.body;

    // Check availability
    const room = await HotelRoom.findById(roomId);
    if (!room || room.availableRooms <= 0) {
      return res.status(400).json({ success: false, message: 'Room not available' });
    }

    const booking = new HotelBooking({
      userId,
      hotelId,
      roomId,
      checkIn,
      checkOut,
      guests,
      amount: totalAmount,
      status: 'Pending'
    });

    await booking.save();
    
    // Decrease availability (Simplified: should be date-based in real app, but for now we follow schema)
    room.availableRooms -= 1;
    if (room.availableRooms === 0) room.status = 'Full';
    await room.save();

    res.status(201).json({ success: true, data: booking });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Admin Features ---

export const approveHotel = async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { status } = req.body; // Approved | Rejected
    const hotel = await Hotel.findByIdAndUpdate(hotelId, { status }, { new: true });
    res.json({ success: true, data: hotel });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await HotelBooking.find().populate('hotelId roomId userId');
    res.json({ success: true, data: bookings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update Booking Status (Check-in, Check-out, etc)
 */
export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const { status } = req.body; // Confirmed | CheckedIn | CheckedOut | Cancelled

  const booking = await HotelBooking.findById(bookingId);
  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking not found' });
    return;
  }

  // Basic status validation logic
  if (status === 'CheckedOut' && booking.bookingStatus !== 'CheckedIn') {
    res.status(400).json({ success: false, message: 'Only checked-in guests can be checked out' });
    return;
  }

  booking.bookingStatus = status;
  await booking.save();

  res.json({ success: true, message: `Guest status updated to ${status}`, data: booking });
});

/**
 * Generate Stay Invoice PDF
 */
export const getStayInvoice = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params;

  const booking = await HotelBooking.findById(bookingId)
    .populate('hotelId')
    .populate('roomId')
    .populate('userId');

  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking not found' });
    return;
  }

  const pdfBuffer = await PDFService.generateHotelStayInvoice(booking);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=HotelInvoice-${bookingId}.pdf`);
  res.send(pdfBuffer);
});
