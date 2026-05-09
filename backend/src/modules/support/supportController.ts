import { Request, Response } from 'express';
import SupportTicket from '../../models/SupportTicket';
import { asyncHandler } from '../../utils/asyncHandler';

/**
 * Create a new support ticket
 */
export const createTicket = asyncHandler(async (req: any, res: Response) => {
  const { category, subject, description, orderId, priority } = req.body;
  const userId = req.user.userId || req.user._id;

  const ticket = await SupportTicket.create({
    userId,
    orderId: orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
    category,
    subject,
    description,
    priority: priority || 'Medium',
    messages: [
      {
        sender: 'User',
        message: description
      }
    ]
  });

  // Automatically escalate order status if ticket is linked to an order
  if (orderId) {
    try {
      const Order = mongoose.models.Order || require('../../models/Order').default;
      await Order.findByIdAndUpdate(orderId, {
        isEscalated: true,
        escalationStatus: 'Pending',
        escalationReason: category === 'Delivery Issue' ? 'delayed' : 'other',
        escalationNotes: `Support ticket filed: ${subject}. Description: ${description}`,
        escalatedAt: new Date()
      });
    } catch (orderEscError) {
      console.error('[SupportTicket] Order escalation sync failed:', orderEscError);
    }
  }

  res.status(201).json({ success: true, data: ticket });
});

/**
 * Get all tickets for a user
 */
export const getUserTickets = asyncHandler(async (req: any, res: Response) => {
  const tickets = await SupportTicket.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: tickets });
});

/**
 * Get ticket details
 */
export const getTicketDetails = asyncHandler(async (req: any, res: Response) => {
  const ticket = await SupportTicket.findById(req.params.id).populate('orderId');
  if (!ticket) {
    res.status(404).json({ success: false, message: 'Ticket not found' });
    return;
  }
  res.json({ success: true, data: ticket });
});

/**
 * Add message to ticket
 */
export const addTicketMessage = asyncHandler(async (req: any, res: Response) => {
  const { message } = req.body;
  const ticket = await SupportTicket.findById(req.params.id);

  if (!ticket) {
     res.status(404).json({ success: false, message: 'Ticket not found' });
     return;
  }

  ticket.messages.push({
    sender: req.user.role === 'admin' ? 'Admin' : 'User',
    message
  });

  await ticket.save();
  res.json({ success: true, data: ticket });
});
