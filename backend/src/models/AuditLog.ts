import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  userType: 'Admin' | 'Seller' | 'Customer' | 'Delivery';
  userName: string;
  action: string;
  module: 'Hotel' | 'Bus' | 'User' | 'Settings' | 'RBAC' | 'Other';
  details: Schema.Types.Mixed;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'userType'
    },
    userType: {
      type: String,
      required: true,
      enum: ['Admin', 'Seller', 'Customer', 'Delivery']
    },
    userName: {
      type: String,
      required: true,
      trim: true
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    module: {
      type: String,
      required: true,
      enum: ['Hotel', 'Bus', 'User', 'Settings', 'RBAC', 'Other']
    },
    details: {
      type: Schema.Types.Mixed,
      required: true
    },
    ipAddress: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ module: 1 });
AuditLogSchema.index({ userId: 1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLog;
