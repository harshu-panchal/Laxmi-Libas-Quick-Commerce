import mongoose, { Document, Schema } from 'mongoose';
import { ILocationData, LocationSchema } from './schemas/LocationSchema';

export interface IHotel extends Document {
  sellerId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  propertyType: string; // e.g. Hotel, Homestay, Resort
  spaceType: string; // e.g. Entire Place, Private Room
  address: string;
  city: string;
  state: string;
  pincode: string;
  structuredLocation?: ILocationData;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  amenities: string[];
  images: Array<{
    url: string;
    category?: string;
    caption?: string;
  }>;
  mainImage: string;
  policies: {
    checkInTime: string;
    checkOutTime: string;
    coupleFriendly: boolean;
    petsAllowed: boolean;
    smokingAllowed: boolean;
    localIdsAllowed: boolean;
    alcoholAllowed: boolean;
    forEvents: boolean;
    outsideFoodAllowed: boolean;
  };
  details: {
    totalFloors?: number;
    totalRooms?: number;
  };
  kyc: {
    docType: string;
    idNumber: string;
    docFront: string;
    docBack: string;
    verified: boolean;
  };
  status: 'Pending' | 'Approved' | 'Rejected' | 'Blocked' | 'Draft';
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
    propertyType: {
      type: String,
      default: 'Hotel',
    },
    spaceType: {
      type: String,
      default: 'Private Room',
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
    structuredLocation: {
      type: LocationSchema,
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
    images: [{
      url: String,
      category: String,
      caption: String,
    }],
    mainImage: String,
    policies: {
      checkInTime: { type: String, default: '12:00 PM' },
      checkOutTime: { type: String, default: '11:00 AM' },
      coupleFriendly: { type: Boolean, default: false },
      petsAllowed: { type: Boolean, default: false },
      smokingAllowed: { type: Boolean, default: false },
      localIdsAllowed: { type: Boolean, default: false },
      alcoholAllowed: { type: Boolean, default: false },
      forEvents: { type: Boolean, default: false },
      outsideFoodAllowed: { type: Boolean, default: false }
    },
    details: {
      totalFloors: Number,
      totalRooms: Number
    },
    kyc: {
      docType: { type: String, default: 'Aadhaar Card' },
      idNumber: String,
      docFront: String,
      docBack: String,
      verified: { type: Boolean, default: false }
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Blocked', 'Draft'],
      default: 'Draft',
    },
    stars: {
      type: Number,
      default: 3,
      min: 1,
      max: 5
    },
    basePrice: {
      type: Number,
      default: 0
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

// Sync location from structuredLocation
HotelSchema.pre('save', function(next) {
  if (this.structuredLocation && this.structuredLocation.coordinates) {
    const { lat, lng } = this.structuredLocation.coordinates;
    if (lat && lng) {
      this.location = {
        type: 'Point',
        coordinates: [lng, lat]
      };
    }
  }
  next();
});

// Normalize city and state before saving
HotelSchema.pre('save', function(next) {
  if (this.city) {
    this.city = this.city
      .trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  if (this.state) {
    this.state = this.state
      .trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  next();
});

const Hotel = mongoose.models.Hotel || mongoose.model<IHotel>('Hotel', HotelSchema);
export default Hotel;
