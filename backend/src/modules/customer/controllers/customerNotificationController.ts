import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import Notification from "../../../models/Notification";

/**
 * Get Notifications
 * Fetches notifications for the logged-in customer
 */
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.user?.userId;

    const notifications = await Notification.find({
        recipientType: "Customer",
        $or: [
            { recipientId: customerId },
            { recipientId: null } // Broadcasts to all customers
        ]
    })
        .sort({ createdAt: -1 })
        .limit(50); // Limit to last 50 notifications

    return res.status(200).json({
        success: true,
        data: notifications
    });
});

/**
 * Mark Notification as Read
 */
export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const customerId = req.user?.userId;

    const notification = await Notification.findOneAndUpdate(
        { _id: id, recipientType: "Customer", recipientId: customerId },
        { isRead: true, readAt: new Date() },
        { new: true }
    );

    if (!notification) {
        return res.status(404).json({
            success: false,
            message: "Notification not found or access denied"
        });
    }

    return res.status(200).json({
        success: true,
        message: "Notification marked as read"
    });
});

/**
 * Mark All Notifications as Read
 */
export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.user?.userId;

    await Notification.updateMany(
        { recipientType: "Customer", recipientId: customerId, isRead: false },
        { isRead: true, readAt: new Date() }
    );

    return res.status(200).json({
        success: true,
        message: "All notifications marked as read"
    });
});
