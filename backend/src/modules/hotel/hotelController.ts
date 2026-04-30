import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Hotel from '../../models/Hotel';
import HotelRoom from '../../models/HotelRoom';
import HotelBooking from '../../models/HotelBooking';
import { PDFService } from '../../services/PDFService';
import { asyncHandler } from '../../utils/asyncHandler';
import axios from 'axios';
import { normalizeCity, calculateDistance } from '../../utils/locationUtils';
import { InventoryService } from '../../services/inventoryService';

// --- Seller Features ---

/**
 * @desc    Save step-by-step onboarding for a property (draft mode)
 */
export const saveOnboardingStep = async (req: Request, res: Response) => {
  try {
    const { hotelDraftId, step, ...data } = req.body;
    const sellerId = (req as any).user.userId;

    let hotel;

    if (hotelDraftId) {
      const updateFields: any = { ...data };

      // Ensure we don't accidentally overwrite sellerId or other critical fields
      delete updateFields.sellerId;
      delete updateFields._id;

      hotel = await Hotel.findByIdAndUpdate(
        hotelDraftId,
        { $set: updateFields },
        { new: true, runValidators: false }
      );

      if (!hotel) {
        hotel = new Hotel({ ...data, sellerId, status: 'Draft' });
        await hotel.save({ validateBeforeSave: false });
      }
    } else {
      hotel = new Hotel({
        ...data,
        name: data.name || 'Draft Property',
        sellerId,
        status: 'Draft'
      });
      await hotel.save({ validateBeforeSave: false });
    }

    res.status(200).json({
      success: true,
      message: `Step ${step} saved`,
      hotelId: hotel._id
    });

  } catch (error: any) {
    console.error('Save Onboarding Step Error:', error);
    res.status(500).json({ success: false, message: 'Server error saving draft' });
  }
};

export const addHotel = async (req: Request, res: Response) => {
  try {
    const sellerId = new mongoose.Types.ObjectId((req as any).user.userId);
    const { latitude, longitude, ...hotelData } = req.body;

    // Format location for GeoJSON support
    const location = (latitude && longitude) ? {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    } : {
      type: 'Point',
      coordinates: [0, 0]
    };

    const hotel = new Hotel({
      ...hotelData,
      sellerId,
      location,
      status: 'Pending'
    });

    await hotel.save();
    console.log(`🏨 New Hotel Added: ${hotel.name} by Seller: ${sellerId}`);
    res.status(201).json({ success: true, data: hotel });
  } catch (error: any) {
    console.error('❌ Add Hotel Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHotel = async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const sellerId = (req as any).user.userId;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    if (hotel.sellerId.toString() !== sellerId && (req as any).user.userType !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updatedHotel = await Hotel.findByIdAndUpdate(hotelId, req.body, { new: true });
    res.json({ success: true, data: updatedHotel });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteHotel = async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const sellerId = (req as any).user.userId;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    if (hotel.sellerId.toString() !== sellerId && (req as any).user.userType !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await hotel.deleteOne();
    res.json({ success: true, message: 'Hotel deleted successfully' });
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

export const getHotelRooms = async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const rooms = await HotelRoom.find({ hotelId });
    res.json({ success: true, data: rooms });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRoomStatus = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { status } = req.body;
    const room = await HotelRoom.findByIdAndUpdate(roomId, { status }, { new: true });
    res.json({ success: true, data: room });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSellerHotels = async (req: Request, res: Response) => {
  try {
    const sellerIdStr = (req as any).user.userId;
    console.log(`🔍 Fetching hotels for seller: ${sellerIdStr}`);

    // Cast to ObjectId because the Hotel.sellerId field is stored as ObjectId,
    // but JWT carries it as a plain string — direct string comparison would fail.
    const sellerId = new mongoose.Types.ObjectId(sellerIdStr);

    const hotels = await Hotel.find({ sellerId }).sort({ createdAt: -1 });
    console.log(`✅ Found ${hotels.length} hotels for seller ${sellerIdStr}`);

    return res.json({
      success: true,
      count: hotels.length,
      data: hotels
    });
  } catch (error: any) {
    console.error('❌ Get Seller Hotels Error:', error);
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
    const { city, search, minPrice, maxPrice, latitude, longitude } = req.query;
    // Include Pending and Approved so new hotels show up immediately for testing
    const query: any = { status: { $in: ['Approved', 'Pending'] } };

    const userLat = latitude ? Number(latitude) : null;
    const userLng = longitude ? Number(longitude) : null;

    if (city) {
      query.city = { $regex: `^${(city as string).trim()}$`, $options: 'i' };
    } else if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [userLng, userLat]
          },
          $maxDistance: 50000 // 50 km default
        }
      };
    }
    if (search) query.name = { $regex: search as string, $options: 'i' };
    let hotels = await Hotel.find(query).lean();
    // Map through hotels to calculate distance if user coords are present
    hotels = hotels.map((hotel: any) => {
      let distance = null;
      if (userLat && userLng && hotel.location?.coordinates) {
        distance = calculateDistance(
          userLat,
          userLng,
          hotel.location.coordinates[1], // lat
          hotel.location.coordinates[0]  // lng
        );
      }
      return { ...hotel, distance };
    });

    // Map through hotels to ensure they have a basePrice if they have rooms
    const hotelsWithPrices = await Promise.all(hotels.map(async (hotel: any) => {
      if (!hotel.basePrice || hotel.basePrice === 0) {
        // Find the cheapest room for this hotel
        const cheapestRoom = await HotelRoom.findOne({ hotelId: hotel._id, status: 'Available' })
          .sort({ pricePerNight: 1 })
          .lean();

        if (cheapestRoom) {
          hotel.basePrice = cheapestRoom.pricePerNight;
        }
      }
      return hotel;
    }));

    res.json({ success: true, data: hotelsWithPrices });
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

export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const bookings = await HotelBooking.find({ userId }).populate('hotelId roomId');
    res.json({ success: true, data: bookings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBooking = async (req: Request, res: Response) => {
  try {
    const userIdStr = (req as any).user.userId;
    let { hotelId, roomId, rooms, checkIn, checkOut, guests, totalAmount, amount } = req.body;

    console.log('📝 Creating booking for user:', userIdStr, 'Body:', req.body);

    // Support both direct roomId or rooms array from frontend
    if (!roomId && rooms && rooms.length > 0) {
      roomId = rooms[0].roomId;
    }

    // Support both amount or totalAmount
    totalAmount = totalAmount || amount;

    // Default guests if not provided
    if (!guests) guests = 1;

    if (!hotelId || !roomId || !checkIn || !checkOut || !totalAmount) {
      console.error('❌ Booking validation failed: Missing fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required booking fields: hotelId, roomId/rooms, checkIn, checkOut, and totalAmount are required'
      });
    }

    const room = await HotelRoom.findById(roomId);
    if (!room) {
      console.error('❌ Room not found:', roomId);
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.availableRooms <= 0) {
      console.warn('⚠️ Room not available (Primary check):', roomId);
      return res.status(400).json({ success: false, message: 'No rooms available for this type' });
    }

    // --- NEW: ROOM AVAILABILITY LAYER (Date-wise check) ---
    try {
      await InventoryService.checkAndLockRoomAvailability(hotelId, roomId, new Date(checkIn), new Date(checkOut), 1);
    } catch (availError: any) {
      return res.status(409).json({ success: false, message: availError.message });
    }
    // -----------------------------------------------------

    const userId = new mongoose.Types.ObjectId(userIdStr);

    const booking = new HotelBooking({
      userId,
      hotelId: new mongoose.Types.ObjectId(hotelId),
      roomId: new mongoose.Types.ObjectId(roomId),
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests,
      totalAmount,
      bookingStatus: 'LOCKED',
      paymentStatus: 'Pending',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 min lock
    });

    await booking.save();
    console.log('✅ Booking created successfully:', booking._id);
    res.status(201).json({ success: true, data: booking });
  } catch (error: any) {
    console.error('❌ Create Booking Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCurrentLocation = async (req: Request, res: Response) => {
  try {
    const ipResponse = await axios.get('http://ip-api.com/json');
    if (ipResponse.data && ipResponse.data.status === 'success') {
      return res.status(200).json({
        success: true,
        location: {
          lat: ipResponse.data.lat,
          lng: ipResponse.data.lon,
          city: ipResponse.data.city,
          type: 'ip-based'
        }
      });
    }
    res.status(404).json({ success: false, message: 'Could not detect location' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error detecting location' });
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

export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const { status } = req.body;

  const booking = await HotelBooking.findById(bookingId);
  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking not found' });
    return;
  }

  booking.bookingStatus = status;
  await booking.save();

  res.json({ success: true, message: `Guest status updated to ${status}`, data: booking });
});

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

/**
 * Get unique cities for hotel selection
 */
export const getHotelCities = asyncHandler(async (_req: Request, res: Response) => {
  const cities = await Hotel.distinct('city', { status: { $in: ['Approved', 'Pending'] } });
  const sortedCities = cities.filter(Boolean).sort();

  res.json({
    success: true,
    data: sortedCities
  });
});

// ─── Hotel Partner Wallet System ───────────────────────────────────────────────

/**
 * @desc    Get wallet stats for the hotel partner (earnings from bookings)
 */
export const getHotelWalletStats = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = new mongoose.Types.ObjectId((req as any).user.userId);

  // Get all hotels for this partner
  const hotels = await Hotel.find({ sellerId }).select('_id');
  const hotelIds = hotels.map(h => h._id);

  // Get all confirmed/paid bookings across all hotels
  const bookings = await HotelBooking.find({
    hotelId: { $in: hotelIds },
    paymentStatus: 'Paid'
  });

  const totalEarnings = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  
  // Platform commission: 10%
  const commissionRate = 0.10;
  const platformCut = totalEarnings * commissionRate;
  const netEarnings = totalEarnings - platformCut;

  // Pending settlement = bookings that are Locked/Confirmed but not yet Checked In/Out
  const pendingBookings = await HotelBooking.find({
    hotelId: { $in: hotelIds },
    paymentStatus: 'Paid',
    bookingStatus: { $in: ['LOCKED', 'Confirmed'] }
  });
  const pendingSettlement = pendingBookings.reduce((sum, b) => sum + (b.totalAmount || 0) * (1 - commissionRate), 0);

  // Get withdrawal requests (using WithdrawRequest model)
  let totalWithdrawn = 0;
  try {
    const WithdrawRequest = mongoose.models['WithdrawRequest'];
    if (WithdrawRequest) {
      const approved = await WithdrawRequest.find({
        userId: sellerId,
        userType: 'HOTEL',
        status: 'Completed'
      });
      totalWithdrawn = approved.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
    }
  } catch (e) { /* WithdrawRequest model may not exist yet, ignore */ }

  const availableBalance = netEarnings - totalWithdrawn - pendingSettlement;

  res.json({
    success: true,
    data: {
      availableBalance: Math.max(0, availableBalance),
      totalEarnings: netEarnings,
      pendingSettlement,
      totalWithdrawn,
      totalBookings: bookings.length,
      commissionRate: commissionRate * 100
    }
  });
});

/**
 * @desc    Get wallet transactions (booking earnings) for hotel partner
 */
export const getHotelWalletTransactions = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = new mongoose.Types.ObjectId((req as any).user.userId);
  const hotels = await Hotel.find({ sellerId }).select('_id name');
  const hotelIds = hotels.map(h => h._id);
  const hotelNameMap: Record<string, string> = {};
  hotels.forEach((h: any) => { hotelNameMap[h._id.toString()] = h.name; });

  const bookings = await HotelBooking.find({
    hotelId: { $in: hotelIds },
    paymentStatus: { $in: ['Paid', 'Pending'] }
  })
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const transactions = bookings.map((b: any) => ({
    _id: b._id,
    type: 'Credit',
    title: `Booking from ${(b.userId as any)?.name || 'Guest'} — ${hotelNameMap[b.hotelId?.toString()] || 'Hotel'}`,
    amount: b.totalAmount * 0.9, // After 10% commission
    grossAmount: b.totalAmount,
    status: b.paymentStatus === 'Paid' ? 'Completed' : 'Pending',
    reference: `BK-${String(b._id).slice(-6).toUpperCase()}`,
    bookingStatus: b.bookingStatus,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    createdAt: b.createdAt
  }));

  res.json({ success: true, data: transactions });
});

/**
 * @desc    Get withdrawal requests for hotel partner
 */
export const getHotelWithdrawalRequests = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;

  let requests: any[] = [];
  try {
    const WithdrawRequest = mongoose.models['WithdrawRequest'];
    if (WithdrawRequest) {
      requests = await WithdrawRequest.find({ userId: sellerId, userType: 'HOTEL' })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    }
  } catch (e) { /* ignore if model not set up */ }

  res.json({ success: true, data: requests });
});

/**
 * @desc    Create a withdrawal request for hotel partner
 */
export const createHotelWithdrawalRequest = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;
  const { amount, accountDetails, paymentMethod } = req.body;

  if (!amount || amount <= 0) {
    res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
    return;
  }

  let request: any = {
    _id: new mongoose.Types.ObjectId(),
    sellerId,
    userType: 'HOTEL',
    amount,
    accountDetails,
    paymentMethod: paymentMethod || 'Bank Transfer',
    status: 'Pending',
    createdAt: new Date()
  };

  try {
    const WithdrawRequest = mongoose.models['WithdrawRequest'];
    if (WithdrawRequest) {
      request = await WithdrawRequest.create({
        userId: sellerId,
        userType: 'HOTEL',
        amount,
        accountDetails,
        paymentMethod: paymentMethod || 'Bank Transfer',
        status: 'Pending'
      });
    }
  } catch (e) {
    console.error('WithdrawRequest creation error:', e);
  }

  res.status(201).json({ success: true, data: request, message: 'Withdrawal request submitted successfully' });
});

