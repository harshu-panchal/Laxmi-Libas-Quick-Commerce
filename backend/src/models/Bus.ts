import mongoose, { Document, Schema } from 'mongoose';

export interface IBus extends Document {
  sellerId: mongoose.Types.ObjectId;
  busName: string;
  from: string;
  to: string;
  departureTime: Date;
  price: number;
  totalSeats: number;
  availableSeats: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const BusSchema = new Schema<IBus>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    busName: {
      type: String,
      required: true,
      trim: true,
    },
    busNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    busType: {
      type: String,
      enum: ['AC', 'Non-AC', 'Sleeper', 'Seater', 'Semisleeper'],
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    from: {
      type: String,
      required: true,
      trim: true,
    },
    to: {
      type: String,
      required: true,
      trim: true,
    },
    departureTime: {
      type: Date,
      required: true,
    },
    arrivalTime: {
      type: Date,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 1,
    },
    availableSeats: {
      type: Number,
      required: true,
      min: 0,
    },
    amenities: [String],
    images: [String],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

const Bus = mongoose.models.Bus || mongoose.model<IBus>('Bus', BusSchema);
export default Bus;
