/**
 * @file adminCustomerController.ts
 * @description Supercharged Admin Controller for Customer Control & Platform Audits (Full A-Z Control)
 */

import { Request, Response } from 'express';
import Customer from '../../../models/Customer';
import Order from '../../../models/Order';
import HotelBooking from '../../../models/HotelBooking';
import BusBooking from '../../../models/BusBooking';
import AuditLog from '../../../models/AuditLog';
import { asyncHandler } from '../../../utils/asyncHandler';

/**
 * Get all customers with filters
 */
export const getAllCustomers = asyncHandler(async (req: Request, res: Response) => {
    const {
        page = 1,
        limit = 10,
        status,
        search,
        sortBy = "registrationDate",
        sortOrder = "desc",
    } = req.query;

    const query: any = {};

    if (status) query.status = status;
    if (search) {
        query.$or = [
            { name: { $regex: search as string, $options: "i" } },
            { email: { $regex: search as string, $options: "i" } },
            { phone: { $regex: search as string, $options: "i" } },
            { refCode: { $regex: search as string, $options: "i" } },
        ];
    }

    const sort: any = {};
    sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [customers, total] = await Promise.all([
        Customer.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit as string)),
        Customer.countDocuments(query),
    ]);

    return res.status(200).json({
        success: true,
        message: "Customers fetched successfully",
        data: customers,
        pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
        },
    });
});

/**
 * Get customer by ID
 */
export const getCustomerById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const customer = await Customer.findById(id);

    if (!customer) {
        return res.status(404).json({
            success: false,
            message: "Customer not found",
        });
    }

    return res.status(200).json({
        success: true,
        message: "Customer fetched successfully",
        data: customer,
    });
});

/**
 * Update customer status with Audit Logging
 */
export const updateCustomerStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Active", "Inactive"].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Status must be Active or Inactive",
        });
    }

    const customer = await Customer.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
    );

    if (!customer) {
        return res.status(404).json({
            success: false,
            message: "Customer not found",
        });
    }

    // Write to Audit Log
    await AuditLog.create({
        userId: req.user?.userId,
        userType: 'Admin',
        userName: req.user?.name || 'Super Admin',
        action: `Change Customer Account Status to ${status}`,
        module: 'User',
        details: { customerId: id, customerName: customer.name, status }
    });

    return res.status(200).json({
        success: true,
        message: "Customer status updated successfully",
        data: customer,
    });
});

/**
 * Get customer orders
 */
export const getCustomerOrders = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query: any = { customer: id };
    if (status) query.status = status;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [orders, total] = await Promise.all([
        Order.find(query)
            .populate("items")
            .populate("deliveryBoy", "name mobile")
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(parseInt(limit as string)),
        Order.countDocuments(query),
    ]);

    return res.status(200).json({
        success: true,
        message: "Customer orders fetched successfully",
        data: orders,
        pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
        },
    });
});

/**
 * Reset customer account stats
 */
export const resetCustomerAccount = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const customer = await Customer.findByIdAndUpdate(
        id,
        {
            totalOrders: 0,
            totalSpent: 0,
            walletAmount: 0,
            address: "",
            city: "",
            state: "",
            pincode: "",
            structuredLocation: undefined
        },
        { new: true }
    );

    if (!customer) {
        return res.status(404).json({
            success: false,
            message: "Customer account not found",
        });
    }

    // Audit log account reset
    await AuditLog.create({
        userId: req.user?.userId,
        userType: 'Admin',
        userName: req.user?.name || 'Super Admin',
        action: "Reset Customer Profile Statistics & Wallet",
        module: 'User',
        details: { customerId: id, customerName: customer.name }
    });

    return res.status(200).json({
        success: true,
        message: "Customer account reset completed successfully",
        data: customer,
    });
});

/**
 * Update customer wallet balance (Increase/Decrease)
 */
export const updateCustomerWallet = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { action, amount, reason } = req.body; // action: credit | debit, amount: positive number, reason: string

    if (!amount || amount <= 0) {
        return res.status(400).json({
            success: false,
            message: "Amount must be a positive number",
        });
    }

    const customer = await Customer.findById(id);
    if (!customer) {
        return res.status(404).json({
            success: false,
            message: "Customer not found",
        });
    }

    let previousAmount = customer.walletAmount;
    if (action === "credit") {
        customer.walletAmount += amount;
    } else if (action === "debit") {
        if (customer.walletAmount < amount) {
            return res.status(400).json({
                success: false,
                message: `Insufficient wallet balance. Current: ₹${customer.walletAmount}`,
            });
        }
        customer.walletAmount -= amount;
    } else {
        return res.status(400).json({
            success: false,
            message: "Invalid wallet action. Must be credit or debit",
        });
    }

    await customer.save();

    // Audit log
    await AuditLog.create({
        userId: req.user?.userId,
        userType: 'Admin',
        userName: req.user?.name || 'Super Admin',
        action: `Wallet adjustment: ${action} ₹${amount}`,
        module: 'User',
        details: { customerId: id, customerName: customer.name, action, amount, previousAmount, newAmount: customer.walletAmount, reason }
    });

    return res.status(200).json({
        success: true,
        message: `Wallet ${action}ed with ₹${amount} successfully`,
        data: customer,
    });
});

/**
 * Get customer referrals details
 */
export const getCustomerReferrals = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const customer = await Customer.findById(id);
    if (!customer) {
        return res.status(404).json({
            success: false,
            message: "Customer not found",
        });
    }

    // Find users referred by this customer
    const referrals = await Customer.find({ referredByCode: customer.refCode })
        .select("name email phone registrationDate status totalSpent");

    return res.status(200).json({
        success: true,
        data: {
            refCode: customer.refCode,
            referredByCode: customer.referredByCode || "None",
            count: referrals.length,
            referrals
        }
    });
});

/**
 * Get unified transaction, order, hotel, and bus bookings history
 */
export const getCustomerUnifiedHistory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const customer = await Customer.findById(id);
    if (!customer) {
        return res.status(404).json({
            success: false,
            message: "Customer not found",
        });
    }

    // Parallel fetch bookings & orders
    const [orders, hotelBookings, busBookings] = await Promise.all([
        Order.find({ customer: id }).select("orderId orderDate status paymentStatus totalAmount items").populate("items"),
        HotelBooking.find({ userId: id }).select("checkIn checkOut bookingStatus paymentStatus totalAmount hotelId").populate("hotelId", "name city"),
        BusBooking.find({ userId: id }).populate({
            path: 'scheduleId',
            populate: [
                { path: 'busId', select: 'name' },
                { path: 'routeId', select: 'from to' }
            ]
        })
    ]);

    // Format into a single chronological timeline
    const timeline: any[] = [];

    orders.forEach(ord => {
        timeline.push({
            id: ord._id,
            type: "Food / Grocery Order",
            date: ord.orderDate || (ord as any).createdAt,
            amount: (ord as any).totalAmount,
            status: ord.status,
            payment: ord.paymentStatus,
            title: `Order #${(ord as any).orderId || ord._id.toString().slice(-6).toUpperCase()}`,
            description: `Ordered items`
        });
    });

    hotelBookings.forEach(hb => {
        timeline.push({
            id: hb._id,
            type: "Hotel Reservation",
            date: (hb as any).createdAt,
            amount: hb.totalAmount,
            status: hb.bookingStatus,
            payment: hb.paymentStatus,
            title: `${(hb.hotelId as any)?.name || 'Hotel Booking'}`,
            description: `Check-in: ${new Date(hb.checkIn).toLocaleDateString()} - Check-out: ${new Date(hb.checkOut).toLocaleDateString()}`
        });
    });

    busBookings.forEach(bb => {
        const sched = bb.scheduleId as any;
        const fromCity = sched?.routeId?.from || 'Unknown';
        const toCity = sched?.routeId?.to || 'Unknown';
        timeline.push({
            id: bb._id,
            type: "Bus Booking",
            date: (bb as any).createdAt,
            amount: bb.totalAmount,
            status: bb.bookingStatus,
            payment: bb.paymentStatus,
            title: `${fromCity} to ${toCity}`,
            description: `Bus: ${sched?.busId?.name || 'Bus'}, Seats: ${bb.seats?.map((s: any) => s.seatNumber).join(', ')}`
        });
    });

    // Sort descending by date
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.status(200).json({
        success: true,
        data: timeline,
    });
});

/**
 * Get system-wide audit activity logs for admins
 */
export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const { module, action, search, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (module) query.module = module;
    if (action) query.action = { $regex: action as string, $options: "i" };
    if (search) {
        query.$or = [
            { userName: { $regex: search as string, $options: "i" } },
            { action: { $regex: search as string, $options: "i" } },
            { "details.customerId": { $regex: search as string, $options: "i" } },
            { "details.hotelId": { $regex: search as string, $options: "i" } },
            { "details.busId": { $regex: search as string, $options: "i" } },
        ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [logs, total] = await Promise.all([
        AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit as string)),
        AuditLog.countDocuments(query)
    ]);

    return res.status(200).json({
        success: true,
        data: logs,
        pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string))
        }
    });
});
