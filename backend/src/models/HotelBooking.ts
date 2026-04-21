import mongoose, { Document, Schema } from 'mongoose';

export interface IHotelBooking extends Document {
  hotelId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalAmount: number;
  paymentStatus: 'Pending' | 'Success' | 'Failed';
  bookingStatus: 'LOCKED' | 'Confirmed' | 'Cancelled' | 'CheckedIn' | 'CheckedOut';
  merchantOrderId?: string; // PhonePe MT... id for callback lookup
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HotelBookingSchema = new Schema<IHotelBooking>(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'HotelRoom',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer', // Or 'User' depending on schema
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },
    guests: {
      type: Number,
      required: true,
      min: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Success', 'Failed'],
      default: 'Pending',
    },
    bookingStatus: {
      type: String,
      enum: ['LOCKED', 'Confirmed', 'Cancelled', 'CheckedIn', 'CheckedOut'],
      default: 'LOCKED',
    },
    expiresAt: Date, // For lock expiry
    transactionId: String,
    merchantOrderId: {
      type: String,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

HotelBookingSchema.index({ hotelId: 1 });
HotelBookingSchema.index({ userId: 1 });
HotelBookingSchema.index({ bookingStatus: 1 });
HotelBookingSchema.index({ merchantOrderId: 1 }, { sparse: true });

const HotelBooking = mongoose.models.HotelBooking || mongoose.model<IHotelBooking>('HotelBooking', HotelBookingSchema);
export default HotelBooking;
