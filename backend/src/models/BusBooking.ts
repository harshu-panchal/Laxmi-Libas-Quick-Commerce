import mongoose, { Document, Schema } from 'mongoose';

export interface IBusBooking extends Document {
  busId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  seats: string[];   // seat labels e.g. ['A1', 'A2']
  totalPrice: number;
  amount?: number;   // alias for totalPrice
  passengerDetails?: any;
  status: 'LOCKED' | 'confirmed' | 'cancelled';
  paymentStatus: 'Pending' | 'Success' | 'Failed';
  merchantOrderId?: string; // PhonePe MT... id for callback lookup
  transactionId?: string;
  expiresAt?: Date;  // lock expiry
  bookingDate: Date;
}

const BusBookingSchema = new Schema<IBusBooking>(
  {
    busId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seats: {
      type: [String],
      default: [],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
      type: Number,
      min: 0,
    },
    passengerDetails: {
      type: mongoose.Schema.Types.Mixed,
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
