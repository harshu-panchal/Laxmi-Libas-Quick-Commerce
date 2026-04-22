import { Request, Response } from 'express';
import Notification from '../../../models/Notification';
import { asyncHandler } from '../../../utils/asyncHandler';

/**
 * Get notifications for the logged in user/role
 */
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { role, userId } = req.query; // Expecting role and optional userId
  
  const query: any = {};
  if (role) query.role = role;
  if (userId) query.userId = userId;

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    success: true,
    data: notifications
  });
});

/**
 * Mark a notification as read
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const notification = await Notification.findByIdAndUpdate(
    id,
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    res.status(404).json({ success: false, message: 'Notification not found' });
    return;
  }

  res.json({
    success: true,
    data: notification
  });
});

/**
 * Mark all notifications as read for a user/role
 */
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { role, userId } = req.body;

  const query: any = {};
  if (role) query.role = role;
  if (userId) query.userId = userId;

  await Notification.updateMany(query, { isRead: true });

  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
});
