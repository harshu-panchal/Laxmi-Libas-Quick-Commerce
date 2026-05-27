/**
 * Place quick COD order for a seller (DB + optional live API).
 * Seller UI picks it up via socket (if server io) or polling within ~6s.
 * Usage: npx tsx scripts/place-live-test-order.ts [sellerMobile]
 */
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import axios from 'axios';
import { Server as SocketIOServer } from 'socket.io';
import Seller from '../src/models/Seller';
import Product from '../src/models/Product';
import Customer from '../src/models/Customer';
import Order from '../src/models/Order';
import { finalizeOrderCreation } from '../src/services/orderService';
import { generateToken } from '../src/services/jwtService';

dotenv.config({ path: path.join(__dirname, '../.env') });

const SELLER_MOBILE = process.argv[2] || '7004308732';
const API_BASE = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}/api/v1`;

function createMockIo() {
  const events: { room: string; event: string }[] = [];
  const io = {
    to(room: string) {
      return {
        emit(event: string) {
          events.push({ room, event });
        },
      };
    },
  } as unknown as SocketIOServer;
  return { io, events };
}

async function placeViaDb(seller: InstanceType<typeof Seller>, product: InstanceType<typeof Product>, customer: InstanceType<typeof Customer>) {
  const city = seller.city || 'Delhi';
  const lat = Number(seller.latitude) || 28.6139;
  const lng = Number(seller.longitude) || 77.209;
  const price = product.discPrice && product.discPrice > 0 ? product.discPrice : product.price;
  const { io, events } = createMockIo();

  const orders = await finalizeOrderCreation(
    customer._id.toString(),
    {
      items: [
        {
          product: { id: product._id.toString(), _id: product._id.toString(), price },
          quantity: 1,
          selectedDeliveryType: 'quick',
        },
      ],
      address: {
        address: 'Manual test — seller popup + ring',
        city,
        state: 'Delhi',
        pincode: '110001',
        latitude: lat,
        longitude: lng,
      },
      paymentMethod: 'COD',
      fees: { platformFee: 5, deliveryFee: 25, ecomShippingFee: 0 },
      tip: 0,
    },
    io,
    'Paid'
  );

  const order = orders?.[0];
  if (!order) throw new Error('No order created');

  const saved = await Order.findById(order._id);
  const sellerEvents = events.filter(
    (e) => e.event === 'seller-notification' || e.event === 'order:new'
  );

  return {
    orderNumber: saved?.orderNumber || order.orderNumber,
    orderId: order._id.toString(),
    status: saved?.status,
    orderType: saved?.orderType,
    sellerSocketEvents: sellerEvents.length,
  };
}

async function placeViaApi(
  product: InstanceType<typeof Product>,
  customer: InstanceType<typeof Customer>,
  seller: InstanceType<typeof Seller>
) {
  const city = seller.city || 'Delhi';
  const lat = Number(seller.latitude) || 28.6139;
  const lng = Number(seller.longitude) || 77.209;
  const price = product.discPrice && product.discPrice > 0 ? product.discPrice : product.price;
  const token = generateToken(customer._id.toString(), 'Customer');

  const res = await axios.post(
    `${API_BASE}/customer/orders`,
    {
      items: [
        {
          product: { id: product._id.toString(), _id: product._id.toString(), price },
          quantity: 1,
          selectedDeliveryType: 'quick',
        },
      ],
      address: {
        address: 'Live API test — seller notification',
        city,
        state: 'Delhi',
        pincode: '110001',
        latitude: lat,
        longitude: lng,
      },
      paymentMethod: 'COD',
      fees: { platformFee: 5, deliveryFee: 25, ecomShippingFee: 0 },
      tip: 0,
    },
    {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      timeout: 60000,
    }
  );

  const order = res.data?.data?.orders?.[0];
  return {
    orderNumber: order?.orderNumber,
    orderId: order?._id,
    status: order?.status,
    orderType: order?.orderType,
    via: 'live-api' as const,
  };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const seller = await Seller.findOne({ mobile: SELLER_MOBILE });
  if (!seller) {
    console.error(`Seller not found: ${SELLER_MOBILE}`);
    process.exit(1);
  }

  let product = await Product.findOne({
    seller: seller._id,
    publish: true,
    stock: { $gt: 0 },
  }).sort({ updatedAt: -1 });

  if (!product) {
    console.error('No product for seller');
    process.exit(1);
  }

  const customer = await Customer.findOne().sort({ createdAt: -1 });
  if (!customer) {
    console.error('No customer');
    process.exit(1);
  }

  const city = seller.city || customer.city || 'Delhi';
  const lat = Number(seller.latitude) || 28.6139;
  const lng = Number(seller.longitude) || 77.209;

  seller.city = city;
  seller.latitude = String(lat);
  seller.longitude = String(lng);
  seller.location = { type: 'Point', coordinates: [lng, lat] };
  await seller.save();

  product.deliveryType = 'quick';
  product.type = 'quick';
  product.isQuickEligible = true;
  product.city = city;
  product.latitude = lat;
  product.longitude = lng;
  product.location = { type: 'Point', coordinates: [lng, lat] };
  await product.save();

  console.log(`\n🛒 Test order for seller: ${seller.storeName} (${seller.mobile})`);
  console.log(`   Product: ${product.productName}`);
  console.log(`   Customer: ${customer.phone}\n`);

  let result: Awaited<ReturnType<typeof placeViaDb>> & { via?: string };

  try {
    result = { ...(await placeViaApi(product, customer, seller)), via: 'live-api' };
    console.log('✅ Placed via LIVE API (instant socket to seller if dashboard open)\n');
  } catch {
    result = await placeViaDb(seller, product, customer);
    console.log(
      '✅ Placed via DB (seller polling ~6s will show popup; restart backend + use same JWT for instant socket)\n'
    );
  }

  console.log(`   Order: #${result.orderNumber}`);
  console.log(`   Status: ${result.status} | type: ${result.orderType}`);
  console.log(`   _id: ${result.orderId}`);
  if ('sellerSocketEvents' in result) {
    console.log(`   Mock socket events: ${result.sellerSocketEvents}`);
  }
  // Push instant socket to running backend (dev only)
  try {
    await axios.post(
      `${API_BASE}/dev/replay-seller-notify/${result.orderId}`,
      {},
      { headers: { 'x-dev-key': process.env.DEV_REPLAY_KEY || 'local-dev-replay' }, timeout: 15000 }
    );
    console.log('🔔 Live socket replay sent to seller room (instant popup if dashboard open)\n');
  } catch (replayErr: unknown) {
    const ax = replayErr as { response?: { status?: number; data?: unknown }; message?: string };
    console.log(
      `⚠️ Live socket replay skipped (${ax.response?.status || ax.message}) — polling still picks up in ~6s\n`
    );
  }

  console.log('👉 Seller dashboard khula rakho — popup + ring check karo.\n');

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  mongoose.disconnect();
  process.exit(1);
});
