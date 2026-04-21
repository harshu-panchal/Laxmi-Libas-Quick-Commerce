import mongoose, { Document, Schema } from 'mongoose';

export interface IHotel extends Document {
  sellerId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  amenities: string[];
  images: string[];
  mainImage: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Blocked';
  rating: number;
  reviewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const HotelSchema = new Schema<IHotel>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    amenities: [String],
    images: [String],
    mainImage: String,
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Blocked'],
      default: 'Pending',
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

HotelSchema.index({ location: '2dsphere' });
HotelSchema.index({ sellerId: 1 });
HotelSchema.index({ status: 1 });

const Hotel = mongoose.models.Hotel || mongoose.model<IHotel>('Hotel', HotelSchema);
export default Hotel;
