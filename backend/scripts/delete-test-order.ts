/**
 * Delete a test/stuck order by orderNumber.
 * Usage: npx tsx scripts/delete-test-order.ts ORD1779874500065442
 */
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import Order from '../src/models/Order';
import OrderItem from '../src/models/OrderItem';
import DeliveryTracking from '../src/models/DeliveryTracking';
import DeliveryAssignment from '../src/models/DeliveryAssignment';

dotenv.config({ path: path.join(__dirname, '../.env') });

const orderNumber = process.argv[2];
if (!orderNumber) {
  console.error('Usage: npx tsx scripts/delete-test-order.ts <orderNumber>');
  process.exit(1);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const order = await Order.findOne({ orderNumber });
  if (!order) {
    console.log(`Order ${orderNumber} not found`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(
    `Deleting ${order.orderNumber} | status=${order.status} | deliveryBoy=${order.deliveryBoy || 'none'} | _id=${order._id}`
  );

  const orderId = order._id;

  const [items, tracking, assignments] = await Promise.all([
    OrderItem.deleteMany({ order: orderId }),
    DeliveryTracking.deleteMany({ order: orderId }),
    DeliveryAssignment.deleteMany({ order: orderId }),
  ]);

  await Order.deleteOne({ _id: orderId });

  console.log(`✅ Deleted order ${orderNumber}`);
  console.log(`   OrderItems removed: ${items.deletedCount}`);
  console.log(`   DeliveryTracking removed: ${tracking.deletedCount}`);
  console.log(`   DeliveryAssignment removed: ${assignments.deletedCount}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  mongoose.disconnect();
  process.exit(1);
});
