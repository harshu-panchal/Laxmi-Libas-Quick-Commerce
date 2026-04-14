
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected');

    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
    const OrderItem = mongoose.model('OrderItem', new mongoose.Schema({}, { strict: false }));
    const Seller = mongoose.model('Seller', new mongoose.Schema({}, { strict: false }));

    console.log('Fetching last 5 orders...');
    const orders = await Order.find().sort({ createdAt: -1 }).limit(5);

    for (const order of orders as any[]) {
      console.log(`Order: ${order.orderNumber}, Status: ${order.status}, CreatedAt: ${order.createdAt}`);
      
      const items = await OrderItem.find({ order: order._id });
      for (const item of items as any[]) {
        console.log(`  Item: ${item.productName}`);
        const seller = await Seller.findById(item.seller) as any;
        if (seller) {
          console.log(`  Seller: ${seller.storeName}, Loc: ${seller.latitude}, ${seller.longitude}, Radius: ${seller.serviceRadiusKm}`);
        }
      }
      console.log('---');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debug();
