import { Request, Response } from 'express';
import Bus from '../../../models/Bus';
import BusBooking from '../../../models/BusBooking';
import { asyncHandler } from '../../../utils/asyncHandler';

/**
 * Get all buses
 */
export const getAllBuses = asyncHandler(async (req: Request, res: Response) => {
    const { status, from, to } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (from) query.from = { $regex: from as string, $options: 'i' };
    if (to) query.to = { $regex: to as string, $options: 'i' };

    const buses = await Bus.find(query)
        .populate('sellerId', 'sellerName storeName')
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        data: buses,
    });
});

/**
 * Update bus status (Approve/Reject/Block)
 */
export const updateBusStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'inactive', 'pending', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
    }

    const bus = await Bus.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
    );

    if (!bus) {
        return res.status(404).json({
            success: false,
            message: 'Bus not found',
        });
    }

    return res.status(200).json({
        success: true,
        message: `Bus status updated to ${status}`,
        data: bus,
    });
});

/**
 * Get all bus bookings
 */
export const getBusBookings = asyncHandler(async (req: Request, res: Response) => {
    const bookings = await BusBooking.find()
        .populate({
            path: 'scheduleId',
            populate: { path: 'busId' }
        })
        .populate('userId', 'name email mobile')
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        data: bookings,
    });
});
