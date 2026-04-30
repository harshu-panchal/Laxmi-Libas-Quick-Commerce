import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import Order from '../../../models/Order';
import OrderItem from '../../../models/OrderItem';
import { sendNotification } from '../../../services/notificationService';

/**
 * Get all return requests for a seller
 */
export async function getReturnRequests(req: Request, res: Response) {
  const sellerId = (req as any).user.userId;

  // Find all orders that have return status and contain items from this seller
  const orderItems = await OrderItem.find({ seller: sellerId }).distinct('order');
  
  const returns = await Order.find({
    _id: { $in: orderItems },
    returnStatus: { $exists: true, $ne: null }
  }).populate('customer', 'name email phone');

  res.json({ success: true, data: returns });
}

/**
 * Get return request details
 */
export async function getReturnRequestById(req: Request, res: Response) {
  const { id } = req.params;
  const sellerId = (req as any).user.userId;

  const order = await Order.findOne({ _id: id, returnStatus: { $exists: true } })
    .populate('customer', 'name email phone')
    .populate({
      path: 'items',
      match: { seller: sellerId },
      populate: { path: 'product', select: 'productName mainImage' }
    });

  if (!order) {
    res.status(404).json({ success: false, message: 'Return request not found' });
    return;
  }

  res.json({ success: true, data: order });
}

/**
 * Approve or Reject Return Request (Aliased as updateReturnStatus)
 */
export async function updateReturnStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status, reason } = req.body; // Approved | Rejected

  const order = await Order.findById(id);
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return;
  }

  if (status === 'Approved') {
    order.returnStatus = 'Approved';
    order.pickupStatus = 'Pending';
    
    await sendNotification(
      'Customer',
      order.customer.toString(),
      'Return Approved',
      `Your return request for order ${order._id} has been approved. A pickup will be scheduled soon.`,
      { type: 'Order', priority: 'Medium' }
    );
  } else {
    order.returnStatus = 'Rejected';
    
    await sendNotification(
      'Customer',
      order.customer.toString(),
      'Return Rejected',
      `Your return request for order ${order._id} was not approved. Reason: ${reason}`,
      { type: 'Order', priority: 'High' }
    );
  }

  await order.save();
  res.json({ success: true, message: `Return request ${status}`, data: order });
}

/**
 * Update Return Pickup Status
 */
export async function updatePickupStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body; // Pending | Assigned | Completed

  const order = await Order.findById(id);
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return;
  }

  order.pickupStatus = status;
  if (status === 'Completed') {
    order.returnStatus = 'Picked Up';
    // Once picked up, it usually moves to refund processing
  }

  await order.save();
  res.json({ success: true, message: `Pickup status updated to ${status}`, data: order });
}
