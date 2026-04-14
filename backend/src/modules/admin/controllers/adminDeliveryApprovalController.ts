import { Request, Response } from 'express';
import Delivery from '../../../models/Delivery';
import { sendNotification } from '../../../services/notificationService';
import { asyncHandler } from '../../../utils/asyncHandler';

/**
 * Get all pending delivery partners
 */
export const getPendingDeliveries = asyncHandler(async (_req: Request, res: Response) => {
    const deliveries = await Delivery.find({ status: 'Pending' })
        .select('-password')
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        data: deliveries,
        count: deliveries.length,
    });
});

/**
 * Get delivery partners by status
 */
export const getDeliveriesByStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.params;

    if (!['Approved', 'Pending', 'Rejected', 'Blocked'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status. Must be one of: Approved, Pending, Rejected, Blocked',
        });
    }

    const deliveries = await Delivery.find({ status })
        .select('-password')
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        data: deliveries,
        count: deliveries.length,
    });
});

/**
 * Approve a delivery partner
 */
export const approveDelivery = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`[Admin] Attempting to approve delivery partner: ${id}`);
    const adminId = (req as any).user?.id;

    const delivery = await Delivery.findById(id);

    if (!delivery) {
        return res.status(404).json({
            success: false,
            message: 'Delivery partner not found',
        });
    }

    if (delivery.status === 'Approved') {
        return res.status(400).json({
            success: false,
            message: 'Delivery partner is already approved',
        });
    }

    delivery.status = 'Approved';
    delivery.approvedBy = adminId;
    delivery.approvedAt = new Date();
    delivery.rejectionReason = undefined;

    await delivery.save();

    // Send notification to delivery partner
    try {
        await sendNotification(
            'Delivery',
            delivery._id.toString(),
            'Account Approved! 🚚',
            `Congratulations ${delivery.name}! Your delivery partner account has been approved. You can now start accepting orders.`,
            { type: 'Success' }
        );
    } catch (notifError) {
        console.error('Failed to send approval notification:', notifError);
    }

    return res.status(200).json({
        success: true,
        message: 'Delivery partner approved successfully',
        data: delivery,
    });
});

/**
 * Reject a delivery partner
 */
export const rejectDelivery = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Rejection reason is required',
        });
    }

    const delivery = await Delivery.findById(id);

    if (!delivery) {
        return res.status(404).json({
            success: false,
            message: 'Delivery partner not found',
        });
    }

    delivery.status = 'Rejected';
    delivery.rejectionReason = reason;
    delivery.approvedBy = undefined;
    delivery.approvedAt = undefined;

    await delivery.save();

    // Send notification
    try {
        await sendNotification(
            'Delivery',
            delivery._id.toString(),
            'Account Application Update',
            `Your delivery partner account application has been rejected. Reason: ${reason}`,
            { type: 'Warning' }
        );
    } catch (notifError) {
        console.error('Failed to send rejection notification:', notifError);
    }

    return res.status(200).json({
        success: true,
        message: 'Delivery partner rejected successfully',
        data: delivery,
    });
});

/**
 * Block a delivery partner
 */
export const blockDelivery = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const delivery = await Delivery.findById(id);

    if (!delivery) {
        return res.status(404).json({
            success: false,
            message: 'Delivery partner not found',
        });
    }

    delivery.status = 'Blocked';
    if (reason) delivery.rejectionReason = reason;

    await delivery.save();

    // Send notification
    try {
        await sendNotification(
            'Delivery',
            delivery._id.toString(),
            'Account Blocked',
            reason || 'Your account has been blocked. Please contact support.',
            { type: 'Error' }
        );
    } catch (notifError) {
        console.error('Failed to send block notification:', notifError);
    }

    return res.status(200).json({
        success: true,
        message: 'Delivery partner blocked successfully',
    });
});

/**
 * Unblock a delivery partner
 */
export const unblockDelivery = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const delivery = await Delivery.findById(id);

    if (!delivery) {
        return res.status(404).json({
            success: false,
            message: 'Delivery partner not found',
        });
    }

    delivery.status = 'Approved';
    delivery.rejectionReason = undefined;

    await delivery.save();

    return res.status(200).json({
        success: true,
        message: 'Delivery partner unblocked successfully',
    });
});
