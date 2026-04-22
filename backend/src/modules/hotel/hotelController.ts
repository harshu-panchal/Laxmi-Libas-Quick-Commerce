import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Hotel from '../../models/Hotel';
import HotelRoom from '../../models/HotelRoom';
import HotelBooking from '../../models/HotelBooking';
import { PDFService } from '../../services/PDFService';
import { asyncHandler } from '../../utils/asyncHandler';
import axios from 'axios';
import { normalizeCity, calculateDistance } from '../../utils/locationUtils';

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
    const query: any = { status: 'Approved' };
    
    const userLat = latitude ? Number(latitude) : null;
    const userLng = longitude ? Number(longitude) : null;

    if (city) {
      const normalizedCity = normalizeCity(city as string);
      query.city = normalizedCity;
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
    
    if (search) query.name = new RegExp(search as string, 'i');
    
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
        console.warn('⚠️ Room not available:', roomId);
        return res.status(400).json({ success: false, message: 'No rooms available for this type' });
    }

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
  const cities = await Hotel.distinct('city', { status: 'Approved' });
  const sortedCities = cities.sort();
  
  res.json({
    success: true,
    data: sortedCities
  });
});
