import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laxmi-libaas';

async function checkDeliveryStatus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const Delivery = mongoose.model('Delivery', new mongoose.Schema({}, { strict: false }), 'deliveries');
    const onlineBoys = await Delivery.find({ isOnline: true });

    console.log(`Found ${onlineBoys.length} online delivery boys:`);
    onlineBoys.forEach((boy: any) => {
      console.log(`ID: ${boy._id}, Name: ${boy.name}, Mobile: ${boy.mobile}, Status: ${boy.status}`);
    });

    const activeBoys = await Delivery.find({ status: 'Active' });
    console.log(`\nFound ${activeBoys.length} Active delivery boys:`);
    activeBoys.forEach((boy: any) => {
      console.log(`ID: ${boy._id}, Name: ${boy.name}, Mobile: ${boy.mobile}, isOnline: ${boy.isOnline}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDeliveryStatus();
