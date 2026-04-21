import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportMessage {
  sender: 'User' | 'Admin' | 'System';
  message: string;
  attachments?: string[];
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  ticketId: string;
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId; // Optional: if related to an order
  category: 'Order Issue' | 'Payment Issue' | 'Account Issue' | 'Delivery Issue' | 'Other';
  subject: string;
  description: string;
  status: 'Open' | 'In-Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  messages: ISupportMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketId: {
      type: String,
      unique: true,
      required: true,
      uppercase: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: false
    },
    category: {
      type: String,
      enum: ['Order Issue', 'Payment Issue', 'Account Issue', 'Delivery Issue', 'Other'],
      default: 'Other'
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Open', 'In-Progress', 'Resolved', 'Closed'],
      default: 'Open'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    messages: [
      {
        sender: { type: String, enum: ['User', 'Admin', 'System'] },
        message: { type: String, required: true },
        attachments: [String],
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

// Auto-generate Ticket ID before saving
SupportTicketSchema.pre('save', async function (next) {
  if (!this.ticketId) {
    const random = Math.floor(1000 + Math.random() * 9000);
    this.ticketId = `TKT-${Date.now().toString().slice(-6)}-${random}`;
  }
  next();
});

const SupportTicket = mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
export default SupportTicket;
