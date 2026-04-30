import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import Order from '../../../models/Order';
import Payment from '../../../models/Payment';
import { sendNotification } from '../../../services/notificationService';
import mongoose from 'mongoose';

/**
 * Get all pending refund requests (Canceled orders with Paid status)
 */
export const getPendingRefunds = asyncHandler(async (req: Request, res: Response) => {
  const refunds = await Order.find({
    paymentStatus: 'Paid',
    status: 'Cancelled',
    refundStatus: { $ne: 'Completed' }
  }).populate('customer', 'name email phone');

  res.json({ success: true, data: refunds });
});

/**
 * Approve and Process Refund
 */
export const processRefund = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { amount, reason } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return;
  }

  if (order.paymentStatus !== 'Paid') {
    res.status(400).json({ success: false, message: 'Order is not paid' });
    return;
  }

  // Update order refund status
  order.refundStatus = 'Processing';
  order.refundAmount = amount || order.total;
  await order.save();

  // In a real system, you would call the Payment Gateway API here (e.g., PhonePe Refund API)
  // For now, we simulate success
  
  order.refundStatus = 'Completed';
  order.paymentStatus = 'Refunded';
  order.refundedAt = new Date();
  await order.save();

  // Send Notification
  await sendNotification(
    'Customer',
    order.customer.toString(),
    'Refund Processed',
    `A refund of ₹${order.refundAmount} for your order ${order._id} has been processed successfully.`,
    { type: 'Payment', priority: 'Medium' }
  );

  res.json({ success: true, message: 'Refund processed successfully', data: order });
});

/**
 * Get Refund Stats
 */
export const getRefundStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await Order.aggregate([
    { $match: { refundStatus: { $exists: true } } },
    {
      $group: {
        _id: '$refundStatus',
        totalAmount: { $sum: '$refundAmount' },
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({ success: true, data: stats });
});
