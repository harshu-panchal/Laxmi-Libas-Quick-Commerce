
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function update() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to DB');

    const Seller = mongoose.model('Seller', new mongoose.Schema({}, { strict: false }));

    const sellerId = '69d7ab591819fa220f6c6c44'; // aashi kirana
    const newLat = 22.684;
    const newLng = 75.861;

    const result = await Seller.findByIdAndUpdate(
      sellerId,
      {
        latitude: newLat.toString(),
        longitude: newLng.toString(),
        location: {
          type: "Point",
          coordinates: [newLng, newLat] // [longitude, latitude]
        },
        serviceRadiusKm: 40 // Also ensuring radius is sufficient
      },
      { new: true }
    );

    if (result) {
      console.log('UPDATE_SUCCESS');
      console.log(`Updated Seller: ${result.storeName}`);
      console.log(`New Lat/Lng: ${result.latitude}, ${result.longitude}`);
      console.log(`New Radius: ${result.serviceRadiusKm}`);
    } else {
      console.log('Seller not found');
    }

    process.exit(0);
  } catch (err) {
    console.error('Update error:', err);
    process.exit(1);
  }
}

update();
