
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
    const order = await Order.findOne({ orderNumber: 'ORD1775743438925795' });
    console.log(`Order: ${(order as any)?.orderNumber}, CreatedAt: ${(order as any)?.createdAt}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
debug();
