/**
 * @file adminHotelController.ts
 * @description Admin Controller for Hotel Management
 * 
 * Standardizes the admin view to use the Hotel and HotelBooking models 
 * instead of the generic Order or RoomRent models.
 */

import { Request, Response } from 'express';
import Hotel from '../../../models/Hotel';
import HotelRoom from '../../../models/HotelRoom';
import HotelBooking from '../../../models/HotelBooking';
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
        .populate('sellerId', 'sellerName storeName mobile')
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        data: hotels,
    });
});

/**
 * Update hotel approval status
 */
export const updateHotelStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body; // Approved | Rejected | Blocked

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

    return res.status(200).json({
        success: true,
        message: `Hotel status updated to ${status}`,
        data: hotel,
    });
});

/**
 * Get all hotel bookings in the system
 */
export const getHotelBookings = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.query;
    const query: any = {};

    if (status) query.bookingStatus = status;

    const bookings = await HotelBooking.find(query)
        .populate('hotelId', 'name address city')
        .populate('roomId', 'roomType price')
        .populate('userId', 'name email mobile')
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        data: bookings,
    });
});

/**
 * Get dashboard stats for hotels
 */
export const getHotelStats = asyncHandler(async (req: Request, res: Response) => {
    const totalHotels = await Hotel.countDocuments();
    const activeHotels = await Hotel.countDocuments({ status: 'Approved' });
    const pendingHotels = await Hotel.countDocuments({ status: 'Pending' });
    const totalBookings = await HotelBooking.countDocuments({ bookingStatus: 'Confirmed' });

    const totalRevenue = await HotelBooking.aggregate([
        { $match: { paymentStatus: 'Success' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    return res.status(200).json({
        success: true,
        data: {
            totalHotels,
            activeHotels,
            pendingHotels,
            totalBookings,
            revenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
        }
    });
});
