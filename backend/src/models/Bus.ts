import mongoose, { Document, Schema } from 'mongoose';

export interface IBus extends Document {
  sellerId: mongoose.Types.ObjectId;
  busName: string;
  busNumber: string;
  busType: 'AC Sleeper' | 'AC Seater' | 'Non-AC Sleeper' | 'Non-AC Seater' | 'Luxury' | 'Bharat Benz Luxury' | 'AC' | 'Non-AC' | 'Sleeper' | 'Seater' | 'Semisleeper';
  operatorName: string;
  amenities: string[];
  images: string[];
  totalSeats: number;
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
      enum: ['AC Sleeper', 'AC Seater', 'Non-AC Sleeper', 'Non-AC Seater', 'Luxury', 'Bharat Benz Luxury', 'AC', 'Non-AC', 'Sleeper', 'Seater', 'Semisleeper'],
      required: true,
    },
    operatorName: {
      type: String,
      required: true,
    },
    amenities: [String],
    images: [String],
    totalSeats: {
      type: Number,
      required: true,
      min: 1,
    },
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
