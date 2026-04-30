import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomAvailability extends Document {
  hotelId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  date: Date;
  totalRooms: number;
  bookedRooms: number;
}

const RoomAvailabilitySchema = new Schema<IRoomAvailability>(
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
    date: {
      type: Date,
      required: true,
    },
    totalRooms: {
      type: Number,
      required: true,
      min: 0,
    },
    bookedRooms: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index for roomId + date combo
RoomAvailabilitySchema.index({ roomId: 1, date: 1 }, { unique: true });
RoomAvailabilitySchema.index({ hotelId: 1 });

const RoomAvailability = mongoose.models.RoomAvailability || mongoose.model<IRoomAvailability>('RoomAvailability', RoomAvailabilitySchema);
export default RoomAvailability;
