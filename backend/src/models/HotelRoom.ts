import mongoose, { Document, Schema } from 'mongoose';

export interface IHotelRoom extends Document {
  hotelId: mongoose.Types.ObjectId;
  roomType: string; // e.g., Deluxe, Suite, Standard
  description: string;
  pricePerNight: number;
  capacity: number;
  amenities: string[];
  images: Array<{
    url: string;
    caption?: string;
  }>;
  totalRooms: number;
  availableRooms: number;
  status: 'Available' | 'Full' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const HotelRoomSchema = new Schema<IHotelRoom>(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    roomType: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    amenities: [String],
    images: [{
      url: String,
      caption: String,
    }],
    totalRooms: {
      type: Number,
      required: true,
      min: 1,
    },
    availableRooms: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Available', 'Full', 'Inactive'],
      default: 'Available',
    },
  },
  {
    timestamps: true,
  }
);

HotelRoomSchema.index({ hotelId: 1 });
HotelRoomSchema.index({ status: 1 });

const HotelRoom = mongoose.models.HotelRoom || mongoose.model<IHotelRoom>('HotelRoom', HotelRoomSchema);
export default HotelRoom;
