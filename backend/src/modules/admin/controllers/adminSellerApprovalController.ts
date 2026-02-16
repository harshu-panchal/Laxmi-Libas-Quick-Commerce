import { Request, Response } from 'express';
import Seller from '../../../models/Seller';
import { sendNotification } from '../../../services/notificationService';

/**
 * Get all pending sellers
 */
export const getPendingSellers = async (_req: Request, res: Response) => {
    try {
        const sellers = await Seller.find({ status: 'Pending' })
            .select('-password')
            .populate('category', 'name')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: sellers,
            count: sellers.length,
        });
    } catch (error: any) {
        console.error('Error fetching pending sellers:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch pending sellers',
            error: error.message,
        });
    }
};

/**
 * Get sellers by status
 */
export const getSellersByStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.params;

        if (!['Approved', 'Pending', 'Rejected', 'Blocked'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: Approved, Pending, Rejected, Blocked',
            });
        }

        const sellers = await Seller.find({ status })
            .select('-password')
            .populate('category', 'name')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: sellers,
            count: sellers.length,
        });
    } catch (error: any) {
        console.error('Error fetching sellers by status:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sellers',
            error: error.message,
        });
    }
};

/**
 * Approve a seller
 */
export const approveSeller = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = (req as any).user?.id;

        const seller = await Seller.findById(id);

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found',
            });
        }

        if (seller.status === 'Approved') {
            return res.status(400).json({
                success: false,
                message: 'Seller is already approved',
            });
        }

        seller.status = 'Approved';
        seller.approvedBy = adminId;
        seller.approvedAt = new Date();
        seller.rejectionReason = undefined; // Clear any previous rejection reason

        await seller.save();

        // Send notification to seller
        try {
            await sendNotification(
                'Seller',
                seller._id.toString(),
                'Account Approved! 🎉',
                `Congratulations! Your seller account has been approved. You can now start adding products/services.`,
                { type: 'Success' }
            );
        } catch (notifError) {
            console.error('Failed to send approval notification:', notifError);
        }

        return res.status(200).json({
            success: true,
            message: 'Seller approved successfully',
            data: {
                id: seller._id,
                sellerName: seller.sellerName,
                email: seller.email,
                mobile: seller.mobile,
                storeName: seller.storeName,
                status: seller.status,
                approvedAt: seller.approvedAt,
            },
        });
    } catch (error: any) {
        console.error('Error approving seller:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to approve seller',
            error: error.message,
        });
    }
};

/**
 * Reject a seller
 */
export const rejectSeller = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required',
            });
        }

        const seller = await Seller.findById(id);

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found',
            });
        }

        seller.status = 'Rejected';
        seller.rejectionReason = reason;
        seller.approvedBy = undefined;
        seller.approvedAt = undefined;

        await seller.save();

        // Send notification to seller
        try {
            await sendNotification(
                'Seller',
                seller._id.toString(),
                'Account Application Update',
                `Your seller account application has been rejected. Reason: ${reason}`,
                { type: 'Warning' }
            );
        } catch (notifError) {
            console.error('Failed to send rejection notification:', notifError);
        }

        return res.status(200).json({
            success: true,
            message: 'Seller rejected successfully',
            data: {
                id: seller._id,
                sellerName: seller.sellerName,
                status: seller.status,
                rejectionReason: seller.rejectionReason,
            },
        });
    } catch (error: any) {
        console.error('Error rejecting seller:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reject seller',
            error: error.message,
        });
    }
};

/**
 * Block a seller
 */
export const blockSeller = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const seller = await Seller.findById(id);

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found',
            });
        }

        if (seller.status === 'Blocked') {
            return res.status(400).json({
                success: false,
                message: 'Seller is already blocked',
            });
        }

        seller.status = 'Blocked';
        if (reason) {
            seller.rejectionReason = reason;
        }

        await seller.save();

        // Send notification to seller
        try {
            await sendNotification(
                'Seller',
                seller._id.toString(),
                'Account Blocked',
                reason
                    ? `Your seller account has been blocked. Reason: ${reason}`
                    : 'Your seller account has been blocked. Please contact support for more information.',
                { type: 'Error' }
            );
        } catch (notifError) {
            console.error('Failed to send block notification:', notifError);
        }

        return res.status(200).json({
            success: true,
            message: 'Seller blocked successfully',
            data: {
                id: seller._id,
                sellerName: seller.sellerName,
                status: seller.status,
            },
        });
    } catch (error: any) {
        console.error('Error blocking seller:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to block seller',
            error: error.message,
        });
    }
};

/**
 * Unblock a seller
 */
export const unblockSeller = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const seller = await Seller.findById(id);

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found',
            });
        }

        if (seller.status !== 'Blocked') {
            return res.status(400).json({
                success: false,
                message: 'Seller is not blocked',
            });
        }

        seller.status = 'Approved';
        seller.rejectionReason = undefined;

        await seller.save();

        // Send notification to seller
        try {
            await sendNotification(
                'Seller',
                seller._id.toString(),
                'Account Unblocked',
                'Your seller account has been unblocked. You can now access your account.',
                { type: 'Success' }
            );
        } catch (notifError) {
            console.error('Failed to send unblock notification:', notifError);
        }

        return res.status(200).json({
            success: true,
            message: 'Seller unblocked successfully',
            data: {
                id: seller._id,
                sellerName: seller.sellerName,
                status: seller.status,
            },
        });
    } catch (error: any) {
        console.error('Error unblocking seller:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to unblock seller',
            error: error.message,
        });
    }
};

/**
 * Get seller details (for admin review)
 */
export const getSellerDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const seller = await Seller.findById(id)
            .select('-password')
            .populate('category', 'name')
            .populate('approvedBy', 'name email');

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found',
            });
        }

        return res.status(200).json({
            success: true,
            data: seller,
        });
    } catch (error: any) {
        console.error('Error fetching seller details:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch seller details',
            error: error.message,
        });
    }
};
