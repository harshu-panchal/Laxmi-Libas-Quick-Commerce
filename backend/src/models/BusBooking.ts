import mongoose, { Document, Schema } from 'mongoose';

export interface IBusBooking extends Document {
  scheduleId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  seats: {
    seatNumber: string;
    passengerName: string;
    passengerAge: number;
    passengerGender: string;
  }[];
  totalAmount: number;
  pickupPoint: string;
  dropoffPoint: string;
  status: 'LOCKED' | 'confirmed' | 'cancelled';
  paymentStatus: 'Pending' | 'Success' | 'Failed';
  merchantOrderId?: string;
  transactionId?: string;
  expiresAt?: Date;
  bookingDate: Date;
}

const BusBookingSchema = new Schema<IBusBooking>(
  {
    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'BusSchedule',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seats: [
      {
        seatNumber: { type: String, required: true },
        passengerName: { type: String, required: true },
        passengerAge: { type: Number, required: true },
        passengerGender: { type: String, required: true },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    pickupPoint: {
      type: String,
      required: true,
    },
    dropoffPoint: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['LOCKED', 'confirmed', 'cancelled'],
      default: 'LOCKED',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Success', 'Failed'],
      default: 'Pending',
    },
    merchantOrderId: {
      type: String,
      sparse: true,
      index: true,
    },
    transactionId: { type: String },
    expiresAt: Date,
    bookingDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const BusBooking = mongoose.models.BusBooking || mongoose.model<IBusBooking>('BusBooking', BusBookingSchema);
export default BusBooking;
