
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    
    // Models
    const Delivery = mongoose.model('Delivery', new mongoose.Schema({}, { strict: false }));
    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
    const OrderItem = mongoose.model('OrderItem', new mongoose.Schema({}, { strict: false }));

    const mobile = '8770620342';
    const partner = await Delivery.findOne({ mobile }) as any;
    
    if (partner) {
      console.log('PARTNER_INFO');
      console.log(`Name: ${partner.name}`);
      console.log(`Online: ${partner.isOnline}`);
      console.log(`Status: ${partner.status}`);
      
      const activeOrder = await Order.findOne({
        deliveryBoy: partner._id,
        deliveryBoyStatus: { $in: ['Assigned', 'Picked Up', 'In Transit'] },
        status: { $nin: ['Delivered', 'Cancelled', 'Rejected', 'Returned'] }
      });
      console.log(`ActiveOrder: ${activeOrder ? (activeOrder as any).orderNumber : 'None'}`);
    }

    console.log('RECENT_ORDERS');
    const orders = await Order.find().sort({ createdAt: -1 }).limit(3);
    for (const o of orders as any[]) {
      console.log(`Order: ${o.orderNumber} Status: ${o.status}`);
      const items = await OrderItem.find({ order: o._id });
      for (const i of items as any[]) {
        console.log(`  Item: ${i.productName}`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debug();
