import { Schema } from 'mongoose';

export interface ILocationData {
  address?: string;
  city: string;
  state: string;
  country: string;
  pincode?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export const LocationSchema = new Schema({
  address: { type: String },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  country: { type: String, default: 'India', trim: true },
  pincode: { type: String },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  }
}, { _id: false });
