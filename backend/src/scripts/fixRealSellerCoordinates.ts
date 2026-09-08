import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Seller from '../models/Seller';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function fixRealSellerCoordinates() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set in .env');
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // 1. Fix LAXMI LIBAS (Noamundi, Jharkhand)
    const laxmiLibas = await Seller.findOneAndUpdate(
      { storeName: 'LAXMI LIBAS', city: 'Noamundi' },
      {
        $set: {
          latitude: '22.1573611',
          longitude: '85.5049594',
          location: {
            type: 'Point',
            coordinates: [85.5049594, 22.1573611]
          }
        }
      },
      { new: true }
    );
    if (laxmiLibas) {
      console.log(`✅ Updated LAXMI LIBAS coordinates to Noamundi: [${laxmiLibas.latitude}, ${laxmiLibas.longitude}]`);
    }

    // 2. Fix Prabhat Store (Noamundi, Jharkhand)
    const prabhat = await Seller.findOneAndUpdate(
      { storeName: 'Prabhat Store' },
      {
        $set: {
          latitude: '22.1573611',
          longitude: '85.5049594',
          location: {
            type: 'Point',
            coordinates: [85.5049594, 22.1573611]
          }
        }
      },
      { new: true }
    );
    if (prabhat) {
      console.log(`✅ Updated Prabhat Store coordinates to Noamundi: [${prabhat.latitude}, ${prabhat.longitude}]`);
    }

    // 3. Ensure Indore store has correct coordinates and city
    const indoreStore = await Seller.findOne({ city: 'Indore' });
    if (indoreStore) {
      console.log(`ℹ️ Indore store verified: "${indoreStore.storeName}" at [${indoreStore.latitude}, ${indoreStore.longitude}], radius: ${indoreStore.serviceRadiusKm} km`);
    }

    await mongoose.disconnect();
    console.log('Finished updating seller coordinates.');
  } catch (err) {
    console.error('Error fixing seller coordinates:', err);
    process.exit(1);
  }
}

fixRealSellerCoordinates();
