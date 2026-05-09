/**
 * @file adminHotelController.ts
 * @description Supercharged Admin Controller for Hotel Management (Full A-Z Control)
 */

import { Request, Response } from 'express';
import Hotel from '../../../models/Hotel';
import HotelRoom from '../../../models/HotelRoom';
import HotelBooking from '../../../models/HotelBooking';
import Seller from '../../../models/Seller';
import AuditLog from '../../../models/AuditLog';
import { asyncHandler } from '../../../utils/asyncHandler';

/**
 * Get all hotels for admin review
 */
export const getAllHotels = asyncHandler(async (req: Request, res: Response) => {
    const { status, city } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (city) query.city = { $regex: city as string, $options: 'i' };

    const hotels = await Hotel.find(query)
        .populate('sellerId', 'sellerName storeName mobile email commissionRate commission')
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        data: hotels,
    });
});

/**
 * Update hotel approval status with Audit Logging
 */
export const updateHotelStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body; // Approved | Rejected | Blocked | Pending

    const hotel = await Hotel.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
    );

    if (!hotel) {
        return res.status(404).json({
            success: false,
            message: 'Hotel not found',
        });
    }

    // Log the administrative action
    await AuditLog.create({
        userId: req.user?.userId,
        userType: 'Admin',
        userName: req.user?.name || 'Super Admin',
        action: `Update Hotel Status to ${status}`,
        module: 'Hotel',
        details: { hotelId: id, hotelName: hotel.name, status }
    });

    return res.status(200).json({
        success: true,
        message: `Hotel status updated to ${status}`,
        data: hotel,
    });
});

/**
 * Get all hotel bookings in the system with filter capabilities
 */
export const getHotelBookings = asyncHandler(async (req: Request, res: Response) => {
    const { status, hotelId } = req.query;
    const query: any = {};

    if (status) query.bookingStatus = status;
    if (hotelId) query.hotelId = hotelId;

    const bookings = await HotelBooking.find(query)
        .populate('hotelId', 'name address city')
        .populate('roomId', 'roomType pricePerNight price')
        .populate('userId', 'name email phone mobile')
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        data: bookings,
    });
});

/**
 * Get detailed dashboard stats and analytics for hotels
 */
export const getHotelStats = asyncHandler(async (req: Request, res: Response) => {
    const totalHotels = await Hotel.countDocuments();
    const activeHotels = await Hotel.countDocuments({ status: 'Approved' });
    const pendingHotels = await Hotel.countDocuments({ status: 'Pending' });
    const totalBookings = await HotelBooking.countDocuments({ bookingStatus: 'Confirmed' });

    // Aggregate revenue
    const totalRevenue = await HotelBooking.aggregate([
        { $match: { paymentStatus: 'Success', bookingStatus: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Aggregate monthly bookings for charts
    const monthlyBookings = await HotelBooking.aggregate([
        {
            $match: { bookingStatus: { $ne: 'Cancelled' } }
        },
        {
            $group: {
                _id: { $month: "$createdAt" },
                count: { $sum: 1 },
                revenue: { $sum: "$totalAmount" }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Top Performing Hotels
    const topHotels = await HotelBooking.aggregate([
        { $match: { bookingStatus: 'Confirmed' } },
        { $group: { _id: '$hotelId', bookingCount: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
    ]);

    const populatedTopHotels = await Hotel.populate(topHotels, { path: '_id', select: 'name city mainImage propertyType' });

    // Room Availability Statistics
    const roomsStats = await HotelRoom.aggregate([
        {
            $group: {
                _id: null,
                totalRooms: { $sum: '$totalRooms' },
                availableRooms: { $sum: '$availableRooms' }
            }
        }
    ]);

    const totalRoomsCount = roomsStats.length > 0 ? roomsStats[0].totalRooms : 0;
    const availableRoomsCount = roomsStats.length > 0 ? roomsStats[0].availableRooms : 0;
    const occupancyRate = totalRoomsCount > 0 
        ? Math.round(((totalRoomsCount - availableRoomsCount) / totalRoomsCount) * 100) 
        : 0;

    return res.status(200).json({
        success: true,
        data: {
            totalHotels,
            activeHotels,
            pendingHotels,
            totalBookings,
            revenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
            occupancyRate,
            monthlyStats: monthlyBookings,
            topHotels: populatedTopHotels,
            rooms: {
                total: totalRoomsCount,
                available: availableRoomsCount,
                occupied: totalRoomsCount - availableRoomsCount
            }
        }
    });
});

/**
 * Get all rooms for admin pricing & force closing controls
 */
export const adminGetHotelRooms = asyncHandler(async (req: Request, res: Response) => {
    const { hotelId } = req.query;
    const query: any = {};
    if (hotelId) query.hotelId = hotelId;

    const rooms = await HotelRoom.find(query)
        .populate('hotelId', 'name city state status')
        .sort({ hotelId: 1, createdAt: -1 });

    return res.status(200).json({
        success: true,
        data: rooms,
    });
});

/**
 * Edit room pricing, availability and force closing options
 */
export const adminUpdateHotelRoom = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { pricePerNight, totalRooms, availableRooms, status, roomType, description, amenities } = req.body;

    const updateFields: any = {};
    if (pricePerNight !== undefined) updateFields.pricePerNight = pricePerNight;
    if (totalRooms !== undefined) updateFields.totalRooms = totalRooms;
    if (availableRooms !== undefined) updateFields.availableRooms = availableRooms;
    if (status !== undefined) updateFields.status = status; // Available | Full | Inactive
    if (roomType !== undefined) updateFields.roomType = roomType;
    if (description !== undefined) updateFields.description = description;
    if (amenities !== undefined) updateFields.amenities = amenities;

    const room = await HotelRoom.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true })
        .populate('hotelId', 'name');

    if (!room) {
        return res.status(404).json({
            success: false,
            message: 'Hotel room not found',
        });
    }

    // Log administrative action
    await AuditLog.create({
        userId: req.user?.userId,
        userType: 'Admin',
        userName: req.user?.name || 'Super Admin',
        action: 'Update Hotel Room Properties',
        module: 'Hotel',
        details: { roomId: id, roomType: room.roomType, hotelName: (room.hotelId as any)?.name, updates: updateFields }
    });

    return res.status(200).json({
        success: true,
        message: 'Room details updated successfully',
        data: room,
    });
});

/**
 * View all hotel partners
 */
export const getHotelPartners = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.query;
    const query: any = { businessType: 'hotel' };
    if (status) query.status = status;

    const partners = await Seller.find(query)
        .select('sellerName storeName profile email mobile status businessDetails commissionRate commission kycDetails createdAt')
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        data: partners,
    });
});

/**
 * Update partner verification (KYC) & Suspension
 */
export const updatePartnerVerification = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, kycVerified, banPartner } = req.body;

    const updateFields: any = {};
    if (status) updateFields.status = status; // Approved | Blocked | Rejected | Pending
    if (kycVerified !== undefined) {
        updateFields['businessDetails.kycVerified'] = kycVerified;
        updateFields['kycDetails.verified'] = kycVerified;
    }
    if (banPartner !== undefined) {
        updateFields.status = banPartner ? 'Blocked' : 'Approved';
    }

    const seller = await Seller.findByIdAndUpdate(id, updateFields, { new: true });

    if (!seller) {
        return res.status(404).json({
            success: false,
            message: 'Seller partner not found',
        });
    }

    // Log the KYC update or Ban action
    await AuditLog.create({
        userId: req.user?.userId,
        userType: 'Admin',
        userName: req.user?.name || 'Super Admin',
        action: banPartner ? 'Ban/Suspend Hotel Partner' : 'Verify Hotel Partner KYC Documents',
        module: 'Hotel',
        details: { partnerId: id, partnerName: seller.sellerName, storeName: seller.storeName, status: seller.status, kycVerified }
    });

    return res.status(200).json({
        success: true,
        message: 'Partner configuration updated successfully',
        data: seller,
    });
});

/**
 * Admin override booking status or force cancellation/refunds
 */
export const adminProcessBookingAction = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { bookingStatus, paymentStatus } = req.body; // bookingStatus: Confirmed | Cancelled | CheckedIn | CheckedOut, paymentStatus: Success | Pending | Failed

    const updateData: any = {};
    if (bookingStatus) updateData.bookingStatus = bookingStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const booking = await HotelBooking.findByIdAndUpdate(id, updateData, { new: true })
        .populate('hotelId', 'name')
        .populate('userId', 'name');

    if (!booking) {
        return res.status(404).json({
            success: false,
            message: 'Booking record not found',
        });
    }

    // Log booking override in audit history
    await AuditLog.create({
        userId: req.user?.userId,
        userType: 'Admin',
        userName: req.user?.name || 'Super Admin',
        action: `Override Hotel Booking ID: ${id}`,
        module: 'Hotel',
        details: { bookingId: id, hotelName: (booking.hotelId as any)?.name, customerName: (booking.userId as any)?.name, bookingStatus, paymentStatus }
    });

    return res.status(200).json({
        success: true,
        message: `Booking modified successfully. Set status to ${bookingStatus || paymentStatus}`,
        data: booking,
    });
});

/**
 * Update hotel policies directly from Admin Panel
 */
export const adminUpdateHotelPolicies = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { policies } = req.body;

    const hotel = await Hotel.findById(id);
    if (!hotel) {
        return res.status(404).json({
            success: false,
            message: 'Hotel not found',
        });
    }

    hotel.policies = {
        ...hotel.policies,
        ...policies
    };

    await hotel.save();

    // Log administrative action
    await AuditLog.create({
        userId: req.user?.userId,
        userType: 'Admin',
        userName: req.user?.name || 'Super Admin',
        action: `Update Hotel Policies`,
        module: 'Hotel',
        details: { hotelId: id, hotelName: hotel.name, policies }
    });

    return res.status(200).json({
        success: true,
        message: 'Hotel policies updated successfully',
        data: hotel,
    });
});

