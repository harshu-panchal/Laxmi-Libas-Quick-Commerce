import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const HotelSchema = new mongoose.Schema({
  name: String,
  city: String,
  status: String,
});

const Hotel = mongoose.model('Hotel', HotelSchema);

async function checkHotels() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    const ujjainHotels = await Hotel.find({ city: 'Ujjain' });
    console.log('Hotels in Ujjain:', ujjainHotels.map(h => ({ name: h.name, status: h.status })));

    const allHotels = await Hotel.find({}).limit(5);
    console.log('Sample Hotels (any city):', allHotels.map(h => ({ name: h.name, city: h.city, status: h.status })));

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkHotels();
