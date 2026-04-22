import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipientType?: 'Admin' | 'Seller' | 'Customer' | 'Delivery';
  recipientId?: mongoose.Types.ObjectId | string;
  userId?: mongoose.Types.ObjectId; 
  role?: 'admin' | 'seller' | 'user' | 'delivery';
  title?: string;
  message: string;
  type: string;
  link?: string;
  actionLabel?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  isRead: boolean;
  data?: any; 
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    // Legacy fields
    recipientType: { 
      type: String, 
      enum: ['Admin', 'Seller', 'Customer', 'Delivery', 'admin', 'seller', 'user', 'delivery'] 
    },
    recipientId: { type: Schema.Types.Mixed },
    title: { type: String },
    link: { type: String },
    actionLabel: { type: String },
    priority: { 
      type: String, 
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    expiresAt: { type: Date },

    // New unified fields
    userId: { type: Schema.Types.ObjectId, refPath: 'recipientType' },
    role: { type: String },
    type: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ role: 1, createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;
