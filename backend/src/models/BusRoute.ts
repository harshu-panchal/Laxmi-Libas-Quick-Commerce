import mongoose, { Document, Schema } from 'mongoose';
import { ILocationData, LocationSchema } from './schemas/LocationSchema';

export interface IBusRoute extends Document {
  sellerId: mongoose.Types.ObjectId;
  from: string; // Plain string for search matching (normalized)
  to: string;   // Plain string for search matching (normalized)
  fromLocation: ILocationData;
  toLocation: ILocationData;
  fromLocationGeo: {
    type: 'Point';
    coordinates: [number, number];
  };
  toLocationGeo: {
    type: 'Point';
    coordinates: [number, number];
  };
  distance?: string;
  duration?: string;
  pickupPoints: {
    name: string;
    time: string;
    location?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }[];
  dropoffPoints: {
    name: string;
    time: string;
    location?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BusRouteSchema = new Schema<IBusRoute>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
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
    fromLocation: {
      type: LocationSchema,
      required: true
    },
    toLocation: {
      type: LocationSchema,
      required: true
    },
    fromLocationGeo: {
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
    toLocationGeo: {
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
    distance: String,
    duration: String,
    pickupPoints: [
      {
        name: { type: String, required: true },
        time: { type: String, required: true },
        location: String,
        coordinates: {
          lat: Number,
          lng: Number
        }
      },
    ],
    dropoffPoints: [
      {
        name: { type: String, required: true },
        time: { type: String, required: true },
        location: String,
        coordinates: {
          lat: Number,
          lng: Number
        }
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

BusRouteSchema.index({ fromLocationGeo: '2dsphere' });
BusRouteSchema.index({ toLocationGeo: '2dsphere' });

// Sync GeoJSON from structuredLocation
BusRouteSchema.pre('save', function(next) {
  if (this.fromLocation && this.fromLocation.coordinates) {
    const { lat, lng } = this.fromLocation.coordinates;
    if (lat && lng) {
      this.fromLocationGeo = { type: 'Point', coordinates: [lng, lat] };
    }
  }
  if (this.toLocation && this.toLocation.coordinates) {
    const { lat, lng } = this.toLocation.coordinates;
    if (lat && lng) {
      this.toLocationGeo = { type: 'Point', coordinates: [lng, lat] };
    }
  }
  next();
});

// Normalize from and to cities before saving
BusRouteSchema.pre('save', function(next) {
  const normalize = (val: string) => val
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  if (this.from) this.from = normalize(this.from);
  if (this.to) this.to = normalize(this.to);
  
  // Also normalize cities in fromLocation and toLocation
  if (this.fromLocation && this.fromLocation.city) {
    this.fromLocation.city = normalize(this.fromLocation.city);
  }
  if (this.toLocation && this.toLocation.city) {
    this.toLocation.city = normalize(this.toLocation.city);
  }
  
  next();
});

const BusRoute = mongoose.models.BusRoute || mongoose.model<IBusRoute>('BusRoute', BusRouteSchema);
export default BusRoute;
