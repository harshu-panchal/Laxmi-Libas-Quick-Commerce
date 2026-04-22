import mongoose, { Document, Schema } from 'mongoose';

export interface IBusSchedule extends Document {
  busId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  departureTime: string; // e.g. "08:00 PM"
  arrivalTime: string;   // e.g. "06:00 AM"
  departureDate: Date;
  arrivalDate: Date;
  basePrice: number;
  seats: {
    seatNumber: string;
    seatType: 'seater' | 'sleeper';
    isBooked: boolean;
    bookedFor?: 'male' | 'female';
    price?: number;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BusScheduleSchema = new Schema<IBusSchedule>(
  {
    busId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'BusRoute',
      required: true,
    },
    departureTime: {
      type: String,
      required: true,
    },
    arrivalTime: {
      type: String,
      required: true,
    },
    departureDate: {
      type: Date,
      required: true,
    },
    arrivalDate: {
      type: Date,
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
    },
    seats: [
      {
        seatNumber: { type: String, required: true },
        seatType: { type: String, enum: ['seater', 'sleeper'], default: 'seater' },
        isBooked: { type: Boolean, default: false },
        bookedFor: { type: String, enum: ['male', 'female'] },
        price: Number,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const BusSchedule = mongoose.models.BusSchedule || mongoose.model<IBusSchedule>('BusSchedule', BusScheduleSchema);
export default BusSchedule;
