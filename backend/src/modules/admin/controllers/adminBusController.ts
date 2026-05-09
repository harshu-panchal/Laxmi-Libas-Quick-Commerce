/**
 * @file adminBusController.ts
 * @description Supercharged Admin Controller for Bus / Transport Management (Full A-Z Control)
 */

import { Request, Response } from 'express';
import Bus from '../../../models/Bus';
import BusBooking from '../../../models/BusBooking';
import BusRoute from '../../../models/BusRoute';
import BusSchedule from '../../../models/BusSchedule';
import Seller from '../../../models/Seller';
import AuditLog from '../../../models/AuditLog';
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
        .populate('sellerId', 'sellerName storeName mobile email')
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

    // Audit Log
    await AuditLog.create({
        userId: req.user?.userId,
        userType: 'Admin',
        userName: req.user?.name || 'Super Admin',
        action: `Update Bus Status to ${status}`,
        module: 'Bus',
        details: { busId: id, busName: bus.name, status }
    });

    return res.status(200).json({
        success: true,
        message: `Bus status updated to ${status}`,
        data: bus,
    });
});

/**
 * Get all bus bookings (tickets)
 */
export const getBusBookings = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.query;
    const query: any = {};
    if (status) query.bookingStatus = status;

    const bookings = await BusBooking.find(query)
        .populate({
            path: 'scheduleId',
            populate: [
                { path: 'busId', select: 'name busNumber type' },
                { path: 'routeId', select: 'from to' }
            ]
        })
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        data: bookings,
    });
});

/**
 * Get all bus operators (Sellers with businessType: 'bus')
 */
export const getBusOperators = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.query;
    const query: any = { businessType: 'bus' };
    if (status) query.status = status;

    const operators = await Seller.find(query)
        .select('sellerName storeName profile email mobile status businessDetails commissionRate commission kycDetails createdAt')
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        data: operators,
    });
});

/**
 * Update operator verification / KYC documents / Ban partner
 */
export const updateOperatorStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, kycVerified, banPartner } = req.body;

    const updateFields: any = {};
    if (status) updateFields.status = status;
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
            message: 'Bus operator not found',
        });
    }

    // Log the operator audit action
    await AuditLog.create({
        userId: req.user?.userId,
        userType: 'Admin',
        userName: req.user?.name || 'Super Admin',
        action: banPartner ? 'Ban/Suspend Bus Operator' : 'Verify Operator KYC',
        module: 'Bus',
        details: { operatorId: id, operatorName: seller.sellerName, storeName: seller.storeName, status: seller.status, kycVerified }
    });

    return res.status(200).json({
        success: true,
        message: 'Operator configuration updated successfully',
        data: seller,
    });
});

/**
 * Get all bus routes
 */
export const adminGetBusRoutes = asyncHandler(async (req: Request, res: Response) => {
    const routes = await BusRoute.find()
        .populate('sellerId', 'sellerName storeName')
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        data: routes,
    });
});

/**
 * Create a new bus route as Admin
 */
export const adminAddBusRoute = asyncHandler(async (req: Request, res: Response) => {
    const routeData = req.body;

    const newRoute = await BusRoute.create(routeData);

    await AuditLog.create({
        userId: req.user?.userId,
        userType: 'Admin',
        userName: req.user?.name || 'Super Admin',
        action: 'Create Bus Route',
        module: 'Bus',
        details: { routeId: newRoute._id, from: newRoute.from, to: newRoute.to }
    });

    return res.status(201).json({
        success: true,
        message: 'Bus route created successfully',
        data: newRoute,
    });
});

/**
 * Update bus route
 */
export const adminUpdateBusRoute = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const route = await BusRoute.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!route) {
        return res.status(404).json({
            success: false,
            message: 'Route not found',
        });
    }

    await AuditLog.create({
        userId: req.user?.userId,
        userType: 'Admin',
        userName: req.user?.name || 'Super Admin',
        action: 'Update Bus Route',
        module: 'Bus',
        details: { routeId: id, from: route.from, to: route.to, updates: updateData }
    });

    return res.status(200).json({
        success: true,
        message: 'Route details updated successfully',
        data: route,
    });
});

/**
 * Delete a route
 */
export const adminDeleteBusRoute = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const route = await BusRoute.findByIdAndDelete(id);

    if (!route) {
        return res.status(404).json({
            success: false,
            message: 'Route not found',
        });
    }

    await AuditLog.create({
        userId: req.user?.userId,
        userType: 'Admin',
        userName: req.user?.name || 'Super Admin',
        action: 'Delete Bus Route',
        module: 'Bus',
        details: { routeId: id, from: route.from, to: route.to }
    });

    return res.status(200).json({
        success: true,
        message: 'Bus route deleted successfully',
    });
});

/**
 * Get all schedules for Admin
 */
export const adminGetBusSchedules = asyncHandler(async (req: Request, res: Response) => {
    const schedules = await BusSchedule.find()
        .populate('busId', 'name busNumber type')
        .populate('routeId', 'from to distance duration')
        .sort({ departureDate: -1, departureTime: 1 });

    return res.status(200).json({
        success: true,
        data: schedules,
    });
});

/**
 * Add bus schedule as Admin
 */
export const adminAddBusSchedule = asyncHandler(async (req: Request, res: Response) => {
    const scheduleData = req.body;

    // Retrieve bus to populate seats if they are not defined
    if (!scheduleData.seats || scheduleData.seats.length === 0) {
        const bus = await Bus.findById(scheduleData.busId);
        if (bus) {
            const seats: any[] = [];
            // Generate standard seats based on capacity
            const capacity = bus.capacity || 40;
            for (let i = 1; i <= capacity; i++) {
                seats.push({
                    seatNumber: `${i}`,
                    seatType: i <= 12 ? 'sleeper' : 'seater',
                    isBooked: false,
                });
            }
            scheduleData.seats = seats;
        }
    }

    const schedule = await BusSchedule.create(scheduleData);

    await AuditLog.create({
        userId: req.user?.userId,
        userType: 'Admin',
        userName: req.user?.name || 'Super Admin',
        action: 'Create Bus Schedule',
        module: 'Bus',
        details: { scheduleId: schedule._id, busId: schedule.busId, basePrice: schedule.basePrice }
    });

    return res.status(201).json({
        success: true,
        message: 'Bus schedule created successfully',
        data: schedule,
    });
});

/**
 * Edit a bus schedule, postpone / delay / cancel a trip
 */
export const adminUpdateBusSchedule = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const schedule = await BusSchedule.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .populate('busId', 'name busNumber')
        .populate('routeId', 'from to');

    if (!schedule) {
        return res.status(404).json({
            success: false,
            message: 'Bus schedule not found',
        });
    }

    await AuditLog.create({
        userId: req.user?.userId,
        userType: 'Admin',
        userName: req.user?.name || 'Super Admin',
        action: 'Update Bus Schedule (Delay / Cancel / Re-time)',
        module: 'Bus',
        details: { scheduleId: id, busName: (schedule.busId as any)?.name, route: `${(schedule.routeId as any)?.from} -> ${(schedule.routeId as any)?.to}`, updates: updateData }
    });

    return res.status(200).json({
        success: true,
        message: 'Bus schedule updated successfully',
        data: schedule,
    });
});

/**
 * Delete a schedule
 */
export const adminDeleteBusSchedule = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const schedule = await BusSchedule.findByIdAndDelete(id);

    if (!schedule) {
        return res.status(404).json({
            success: false,
            message: 'Schedule not found',
        });
    }

    await AuditLog.create({
        userId: req.user?.userId,
        userType: 'Admin',
        userName: req.user?.name || 'Super Admin',
        action: 'Delete Bus Schedule',
        module: 'Bus',
        details: { scheduleId: id }
    });

    return res.status(200).json({
        success: true,
        message: 'Bus schedule deleted successfully',
    });
});

/**
 * Force cancel bus ticket & release passenger seats
 */
export const adminCancelTicket = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const booking = await BusBooking.findById(id)
        .populate('userId', 'name')
        .populate('scheduleId');

    if (!booking) {
        return res.status(404).json({
            success: false,
            message: 'Ticket booking not found',
        });
    }

    // Force release seats in schedule
    if (booking.scheduleId) {
        const schedule = await BusSchedule.findById(booking.scheduleId);
        if (schedule) {
            const bookedSeatNumbers = booking.seats.map((seat: any) => seat.seatNumber);
            schedule.seats = schedule.seats.map((seat: any) => {
                if (bookedSeatNumbers.includes(seat.seatNumber)) {
                    seat.isBooked = false;
                    delete seat.bookedFor;
                }
                return seat;
            });
            await schedule.save();
        }
    }

    // Mark booking as Cancelled
    booking.bookingStatus = 'Cancelled';
    booking.paymentStatus = 'Failed'; // Mark payment failed to block payouts
    await booking.save();

    await AuditLog.create({
        userId: req.user?.userId,
        userType: 'Admin',
        userName: req.user?.name || 'Super Admin',
        action: `Force Cancel Ticket ID: ${id}`,
        module: 'Bus',
        details: { bookingId: id, passengerName: (booking.userId as any)?.name, releasedSeats: booking.seats.map((s: any) => s.seatNumber) }
    });

    return res.status(200).json({
        success: true,
        message: 'Ticket booking cancelled and seats released successfully',
        data: booking,
    });
});

/**
 * Get detailed dashboard and sales analytics for bus bookings
 */
export const getBusStats = asyncHandler(async (req: Request, res: Response) => {
    const totalBuses = await Bus.countDocuments();
    const activeBuses = await Bus.countDocuments({ status: 'active' });
    const pendingBuses = await Bus.countDocuments({ status: 'pending' });
    const totalTicketsSold = await BusBooking.countDocuments({ bookingStatus: 'Confirmed' });

    // Aggregate revenue
    const revenueStats = await BusBooking.aggregate([
        { $match: { paymentStatus: 'Success', bookingStatus: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Aggregate route performance
    const routePerformance = await BusBooking.aggregate([
        { $match: { bookingStatus: 'Confirmed' } },
        {
            $group: {
                _id: '$scheduleId',
                ticketsCount: { $sum: 1 },
                revenue: { $sum: '$totalAmount' }
            }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
    ]);

    // Populate route performances
    const populatedRoutes = await BusSchedule.populate(routePerformance, [
        { path: '_id.busId', model: 'Bus', select: 'name busNumber' },
        { path: '_id.routeId', model: 'BusRoute', select: 'from to' }
    ]);

    // Calculate seats utilization
    const schedules = await BusSchedule.find({ isActive: true });
    let totalSeatsCount = 0;
    let bookedSeatsCount = 0;

    schedules.forEach(sched => {
        sched.seats.forEach(seat => {
            totalSeatsCount++;
            if (seat.isBooked) bookedSeatsCount++;
        });
    });

    const seatUtilization = totalSeatsCount > 0 
        ? Math.round((bookedSeatsCount / totalSeatsCount) * 100) 
        : 0;

    return res.status(200).json({
        success: true,
        data: {
            totalBuses,
            activeBuses,
            pendingBuses,
            totalTicketsSold,
            revenue: revenueStats.length > 0 ? revenueStats[0].total : 0,
            seatUtilization,
            routesStats: populatedRoutes,
            seats: {
                total: totalSeatsCount,
                booked: bookedSeatsCount,
                available: totalSeatsCount - bookedSeatsCount
            }
        }
    });
});
