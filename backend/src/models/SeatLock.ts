import mongoose, { Document, Schema } from 'mongoose';

export interface ISeatLock extends Document {
  scheduleId: mongoose.Types.ObjectId;
  seatNumber: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
}

const SeatLockSchema = new Schema<ISeatLock>(
  {
    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'BusSchedule',
      required: true,
    },
    seatNumber: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create a TTL index that automatically deletes documents when expiresAt is reached
SeatLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Ensure unique lock for schedule + seat combo
SeatLockSchema.index({ scheduleId: 1, seatNumber: 1 }, { unique: true });

const SeatLock = mongoose.models.SeatLock || mongoose.model<ISeatLock>('SeatLock', SeatLockSchema);
export default SeatLock;
