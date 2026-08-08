import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import Seller from '../src/models/Seller';
import Product from '../src/models/Product';
import Customer from '../src/models/Customer';
import Order from '../src/models/Order';
import Category from '../src/models/Category';
import { finalizeOrderCreation } from '../src/services/orderService';
import { notifyDeliveryBoysOfNewOrder } from '../src/services/orderNotificationService';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI missing in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB Database');

  // 1. Get or find Seller
  let seller = await Seller.findOne({ status: 'Approved' }).sort({ updatedAt: -1 });
  if (!seller) {
    console.error('❌ No Approved seller found');
    process.exit(1);
  }

  // Ensure seller has valid location coordinates
  const indoreLat = 22.726115;
  const indoreLng = 75.882596;
  seller.latitude = seller.latitude || String(indoreLat);
  seller.longitude = seller.longitude || String(indoreLng);
  seller.location = seller.location || { type: 'Point', coordinates: [indoreLng, indoreLat] };
  await seller.save();

  // 2. Get or find Customer
  let customer = await Customer.findOne().sort({ createdAt: -1 });
  if (!customer) {
    console.error('❌ No customer found in DB');
    process.exit(1);
  }

  // 3. Get or find Product
  let product = await Product.findOne({ seller: seller._id, publish: true, stock: { $gt: 0 } });
  if (!product) {
    let category = await Category.findOne();
    product = await Product.create({
      productName: 'Test Fast Order Item',
      smallDescription: 'Auto test item for live delivery verification',
      seller: seller._id,
      category: category?._id,
      categoryId: category?._id,
      price: 150,
      discPrice: 120,
      stock: 50,
      sku: `SKU-TEST-${Date.now()}`,
      publish: true,
      type: 'quick',
      deliveryType: 'quick',
      isQuickEligible: true,
    } as any);
  }

  const price = (product.discPrice && product.discPrice > 0) ? product.discPrice : product.price;

  // 4. Create Order using finalizeOrderCreation
  const mockIo = { to: () => ({ emit: () => {} }) } as any;
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
        address: '123 Fast Test Street, Palasia',
        city: seller.city || 'Indore',
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
    console.error('❌ Failed to finalize order creation');
    process.exit(1);
  }

  // Instantly mark status as 'Accepted' by Seller
  const savedOrder = await Order.findById(order._id);
  if (savedOrder) {
    savedOrder.status = 'Accepted';
    savedOrder.deliveryFlow = 'auto';
    savedOrder.deliveryType = 'instant';
    await savedOrder.save();
  }

  console.log(`\n🎉 Created & Accepted Order #${order.orderNumber}`);
  console.log(`   Seller: ${seller.storeName || seller.sellerName} (${seller.mobile})`);
  console.log(`   Product: ${product.productName}`);
  console.log(`   Customer: ${customer.phone}`);
  console.log(`   Order ID: ${order._id}`);

  // Fetch full populated order for socket trigger
  const fullOrder = await Order.findById(order._id)
    .populate({
      path: 'items',
      populate: { path: 'seller' }
    })
    .lean();

  if (fullOrder) {
    console.log('📡 Order saved to live database in Accepted status.');
    console.log('   Delivery partners connected to socket will receive instant alert.');
  }

  await mongoose.disconnect();
  console.log('Done!');
}

main().catch(err => {
  console.error('Error running test script:', err);
  mongoose.disconnect();
  process.exit(1);
});
