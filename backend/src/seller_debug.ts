// Debug utility file for seller service radius inspection
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Seller from './models/Seller';
import { findSellersWithinRange } from './utils/locationHelper';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export async function checkSellersNearby(lat: number, lng: number) {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const sellerIds = await findSellersWithinRange(lat, lng);
  const sellers = await Seller.find({ _id: { $in: sellerIds } }).select('storeName city serviceRadiusKm');
  await mongoose.disconnect();
  return sellers;
}
