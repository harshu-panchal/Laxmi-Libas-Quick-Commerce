
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    
    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
    const OrderItem = mongoose.model('OrderItem', new mongoose.Schema({}, { strict: false }));
    const Seller = mongoose.model('Seller', new mongoose.Schema({}, { strict: false }));

    const order = await Order.findOne({ orderNumber: 'ORD1775743438925795' });
    if (!order) {
        console.log('Order not found');
        process.exit(1);
    }

    const item = await OrderItem.findOne({ order: order._id }) as any;
    const seller = await Seller.findById(item?.seller) as any;
    
    if (seller) {
        console.log('SELLER_INFO');
        console.log(`ID: ${seller._id}`);
        console.log(`Name: ${seller.storeName}`);
        console.log(`Lat: ${seller.latitude}`);
        console.log(`Lng: ${seller.longitude}`);
        console.log(`Location: ${JSON.stringify(seller.location)}`);
        console.log(`ServiceRadius: ${seller.serviceRadiusKm}`);
    } else {
        console.log('Seller not found');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debug();
