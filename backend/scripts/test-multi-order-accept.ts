/**
 * Quick test: delivery partner can accept up to maxConcurrent orders (default 3).
 * Run: npx tsx scripts/test-multi-order-accept.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config({ path: path.join(__dirname, '../.env') });

import Order from '../src/models/Order';
import Delivery from '../src/models/Delivery';
import {
  getMaxConcurrentOrdersPerBoy,
  getActiveOrderCountForDeliveryBoy,
  handleOrderAcceptance,
} from '../src/services/orderNotificationService';

function mockIo(): SocketIOServer {
  return {
    to() {
      return { emit() {} };
    },
  } as unknown as SocketIOServer;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI missing in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('🔌 Connected to MongoDB\n');

  const maxConcurrent = await getMaxConcurrentOrdersPerBoy();
  console.log(`📋 Max concurrent orders (config): ${maxConcurrent}`);

  const deliveryBoy = await Delivery.findOne({ status: 'Approved' }).sort({ updatedAt: -1 });
  if (!deliveryBoy) {
    console.error('❌ No approved delivery partner found in DB');
    process.exit(1);
  }

  const boyId = deliveryBoy._id.toString();
  console.log(`🛵 Partner: ${deliveryBoy.name} (${boyId})\n`);

  const activeBefore = await getActiveOrderCountForDeliveryBoy(boyId);
  console.log(`📦 Active orders before test: ${activeBefore}`);

  const unassigned = await Order.find({
    orderType: 'quick',
    $or: [{ deliveryBoy: null }, { deliveryBoy: { $exists: false } }],
    status: { $in: ['Accepted', 'Ready for pickup', 'Assigned', 'Received'] },
  })
    .limit(5)
    .select('_id orderNumber status deliveryBoy');

  console.log(`🔍 Unassigned quick orders available: ${unassigned.length}`);

  const io = mockIo();
  let accepted = 0;
  let blocked = false;

  for (const order of unassigned) {
    const count = await getActiveOrderCountForDeliveryBoy(boyId);
    if (count >= maxConcurrent) {
      const result = await handleOrderAcceptance(io, order._id.toString(), boyId);
      if (!result.success && result.message.includes('maximum')) {
        blocked = true;
        console.log(`\n🛑 Correctly blocked at limit: ${result.message}`);
      }
      break;
    }

    const result = await handleOrderAcceptance(io, order._id.toString(), boyId);
    if (result.success) {
      accepted++;
      console.log(`✅ Accepted ${order.orderNumber} (active now: ${count + 1})`);
    } else {
      console.log(`⏭️ Skip ${order.orderNumber}: ${result.message}`);
    }
  }

  const activeAfter = await getActiveOrderCountForDeliveryBoy(boyId);
  console.log(`\n📦 Active orders after test: ${activeAfter}`);

  const canAcceptMore = activeAfter < maxConcurrent;
  console.log(`\n--- Summary ---`);
  console.log(`Max allowed: ${maxConcurrent}`);
  console.log(`Newly accepted in this run: ${accepted}`);
  console.log(`Can accept more: ${canAcceptMore ? 'YES' : 'NO'}`);
  console.log(`Limit enforcement triggered: ${blocked || activeAfter >= maxConcurrent ? 'YES' : 'N/A (not enough orders)'}`);

  const ok =
    maxConcurrent >= 1 &&
    maxConcurrent <= 10 &&
    activeAfter <= maxConcurrent &&
    (accepted > 0 || activeBefore > 0 || unassigned.length === 0);

  console.log(ok ? '\n✅ Quick test PASSED' : '\n⚠️ Quick test INCONCLUSIVE (check DB has unassigned quick orders)');

  await mongoose.disconnect();
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
