import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import axios from 'axios';
import Seller from '../src/models/Seller';
import Product from '../src/models/Product';
import Customer from '../src/models/Customer';
import Order from '../src/models/Order';
import Category from '../src/models/Category';
import { generateToken } from '../src/services/jwtService';
import { finalizeOrderCreation } from '../src/services/orderService';

dotenv.config({ path: path.join(__dirname, '../.env') });

const LIVE_API_URL = 'https://api.laxmart.store/api/v1';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI missing');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  // 1. Get Seller
  let seller = await Seller.findOne({ mobile: '7894561230' });
  if (!seller) {
    seller = await Seller.findOne({ status: 'Approved' }).sort({ updatedAt: -1 });
  }

  if (!seller) {
    console.error('❌ No seller found');
    process.exit(1);
  }

  const indoreLat = 22.726115;
  const indoreLng = 75.882596;
  seller.latitude = String(indoreLat);
  seller.longitude = String(indoreLng);
  seller.location = { type: 'Point', coordinates: [indoreLng, indoreLat] };
  await seller.save();

  // 2. Get Customer
  let customer = await Customer.findOne({ phone: '7894561230' });
  if (!customer) {
    customer = await Customer.findOne().sort({ createdAt: -1 });
  }

  if (!customer) {
    console.error('❌ No customer found');
    process.exit(1);
  }

  // 3. Get Product
  let product = await Product.findOne({ seller: seller._id, publish: true, stock: { $gt: 0 } });
  if (!product) {
    let category = await Category.findOne();
    product = await Product.create({
      productName: 'Fast Delivery Test Item',
      smallDescription: 'Auto test item for live socket popup verification',
      seller: seller._id,
      category: category?._id,
      categoryId: category?._id,
      price: 99,
      discPrice: 89,
      stock: 100,
      sku: `SKU-LIVE-${Date.now()}`,
      publish: true,
      type: 'quick',
      deliveryType: 'quick',
      isQuickEligible: true,
    } as any);
  }

  const price = (product.discPrice && product.discPrice > 0) ? product.discPrice : product.price;
  const mockIo = { to: () => ({ emit: () => {} }) } as any;

  // 4. Create Order in Received status
  const createdOrders = await finalizeOrderCreation(
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
        address: 'Palasia Square, Indore',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
        latitude: indoreLat,
        longitude: indoreLng,
      },
      paymentMethod: 'COD',
      fees: { platformFee: 5, deliveryFee: 25, ecomShippingFee: 0 },
      tip: 0,
    },
    mockIo,
    'Paid'
  );

  const order = createdOrders?.[0];
  if (!order) {
    console.error('❌ Order creation failed');
    process.exit(1);
  }

  console.log(`\n📦 Created Order #${order.orderNumber} (Status: Received)`);

  // 5. Generate Seller JWT Token for live API request
  const sellerToken = generateToken(seller._id.toString(), 'Seller');

  console.log(`📡 Sending PATCH ACCEPT request to Live API (${LIVE_API_URL}/orders/${order._id}/status)...`);

  try {
    const res = await axios.patch(
      `${LIVE_API_URL}/orders/${order._id}/status`,
      { status: 'Accepted' },
      {
        headers: {
          Authorization: `Bearer ${sellerToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    console.log('✅ LIVE API ACCEPT Success:', res.data);
    console.log(`🚀 Live server processed order #${order.orderNumber} and emitted Socket event to Delivery Boy!`);
  } catch (apiErr: any) {
    console.error('⚠️ Live API Request error:', apiErr.response?.data || apiErr.message);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
  process.exit(1);
});
