/**
 * E2E: seed test product → quick COD order → seller accept → delivery accept → deliver → cleanup
 * Run: npx tsx scripts/e2e-quick-order-flow.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config({ path: path.join(__dirname, '../.env') });

import Product from '../src/models/Product';
import Order from '../src/models/Order';
import OrderItem from '../src/models/OrderItem';
import Customer from '../src/models/Customer';
import Seller from '../src/models/Seller';
import Delivery from '../src/models/Delivery';
import Category from '../src/models/Category';
import { finalizeOrderCreation } from '../src/services/orderService';
import { notifyDeliveryBoysOfNewOrder, handleOrderAcceptance } from '../src/services/orderNotificationService';
import { calculateEstimatedDeliveryBoyEarning } from '../src/services/orderNotificationService';

const TEST_TAG = `E2E-QO-${Date.now()}`;
const REPORT: { step: string; ok: boolean; detail: string }[] = [];

function log(step: string, ok: boolean, detail: string) {
  REPORT.push({ step, ok, detail });
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${step}: ${detail}`);
}

function createMockIo() {
  const events: { room: string; event: string; payload: unknown }[] = [];
  const io = {
    to(room: string) {
      return {
        emit(event: string, payload: unknown) {
          events.push({ room, event, payload });
        },
      };
    },
  } as unknown as SocketIOServer;
  return { io, events };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`\n🧪 E2E Quick Order Flow — ${TEST_TAG}\n`);

  let testProductId: mongoose.Types.ObjectId | null = null;
  let testOrderId: mongoose.Types.ObjectId | null = null;
  const testSku = `SKU-${TEST_TAG}`;

  try {
    // --- Setup actors ---
    const seller = await Seller.findOne({ status: 'Approved' }).sort({ updatedAt: -1 });
    if (!seller) {
      log('Find seller', false, 'No Approved seller in DB');
      return;
    }

    const customer = await Customer.findOne().sort({ createdAt: -1 });
    if (!customer) {
      log('Find customer', false, 'No customer in DB');
      return;
    }

    let deliveryBoy = await Delivery.findOne({ status: 'Approved', isOnline: true });
    if (!deliveryBoy) {
      deliveryBoy = await Delivery.findOne({ status: 'Approved' });
    }
    if (!deliveryBoy) {
      log('Find delivery', false, 'No Approved delivery partner in DB');
      return;
    }

    const testCity = seller.city || 'Delhi';
    const lat = 28.6139;
    const lng = 77.209;

    seller.city = testCity;
    seller.latitude = String(lat);
    seller.longitude = String(lng);
    seller.location = { type: 'Point', coordinates: [lng, lat] };
    await seller.save();

    deliveryBoy.city = testCity;
    deliveryBoy.isOnline = true;
    deliveryBoy.location = { type: 'Point', coordinates: [lng + 0.01, lat + 0.01] };
    await deliveryBoy.save();

    log('Setup actors', true, `Seller=${seller.storeName || seller.sellerName}, Customer=${customer.phone}, Delivery=${deliveryBoy.name}`);

    let category = await Category.findOne();
    if (!category) {
      category = await Category.create({
        name: 'E2E Category',
        slug: `e2e-cat-${Date.now()}`,
        status: 'Active',
      } as any);
    }

    // --- Seed product ---
    const product = await Product.create({
      productName: `[E2E TEST] Quick Item ${TEST_TAG}`,
      smallDescription: 'Auto test — safe to delete',
      seller: seller._id,
      category: category._id,
      categoryId: category._id,
      price: 99,
      discPrice: 89,
      stock: 50,
      sku: testSku,
      publish: true,
      status: 'Active',
      deliveryType: 'quick',
      type: 'quick',
      isQuickEligible: true,
      latitude: lat,
      longitude: lng,
      location: { type: 'Point', coordinates: [lng, lat] },
      galleryImages: [],
      tags: ['e2e-test'],
      rating: 4.5,
      reviewsCount: 0,
      discount: 0,
      isReturnable: false,
      requiresApproval: false,
    });
    testProductId = product._id;
    log('Seed product', true, `${product.productName} (_id=${product._id})`);

    const { io, events } = createMockIo();

    // --- Place quick order (COD Paid) ---
    const address = {
      address: 'E2E Test Address 123',
      city: testCity,
      state: 'Delhi',
      pincode: '110001',
      latitude: lat,
      longitude: lng,
    };

    const orders = await finalizeOrderCreation(
      customer._id.toString(),
      {
        items: [
          {
            product: { id: product._id.toString(), _id: product._id.toString(), price: 89 },
            quantity: 1,
            selectedDeliveryType: 'quick',
          },
        ],
        address,
        paymentMethod: 'COD',
        fees: { platformFee: 5, deliveryFee: 25, ecomShippingFee: 0 },
        tip: 0,
      },
      io,
      'Paid'
    );

    if (!orders?.length) {
      log('Place order', false, 'finalizeOrderCreation returned no orders');
      return;
    }

    const order = orders[0];
    testOrderId = order._id;
    const saved = await Order.findById(order._id).populate('items');
    log(
      'Place order',
      saved?.orderType === 'quick',
      `orderNumber=${order.orderNumber} type=${saved?.orderType} status=${saved?.status} deliveryFlow=${saved?.deliveryFlow}`
    );

    const sellerEvents = events.filter(
      (e) => e.event === 'seller-notification' || e.event === 'order:new'
    );
    log(
      'Seller socket notify',
      sellerEvents.length > 0,
      `${sellerEvents.length} seller event(s) emitted (ring depends on seller UI + sound unlock)`
    );

    const deliveryEventsAfterPlace = events.filter((e) => e.event === 'new-order');
    const hasAutoAssign = !!saved?.deliveryBoy;

    log(
      'Delivery notify on place',
      deliveryEventsAfterPlace.length === 0 && !hasAutoAssign,
      hasAutoAssign
        ? `unexpected auto-assignment to ${saved?.deliveryBoy}`
        : `${deliveryEventsAfterPlace.length} new-order broadcast(s) (expected 0)`
    );

    // --- Seller accept ---
    if (saved) {
      saved.status = 'Accepted';
      await saved.save();

      const fullOrder = await Order.findById(saved._id)
        .populate({ path: 'items', populate: { path: 'seller' } })
        .lean();

      if (fullOrder && !saved.deliveryBoy) {
        await notifyDeliveryBoysOfNewOrder(io, fullOrder);
      } else if (fullOrder && saved.deliveryBoy) {
        const assignedId = saved.deliveryBoy.toString();
        const earning = await calculateEstimatedDeliveryBoyEarning(fullOrder);
        io.to(`delivery-${assignedId}`).emit('new-order', {
          orderId: saved._id.toString(),
          orderNumber: saved.orderNumber,
          deliveryBoyEarning: earning,
        });
      }

      log('Seller accept', true, `status=Accepted`);
    }

    const afterAccept = await Order.findById(order._id);
    const deliveryEventsAfterAccept = events.filter((e) => e.event === 'new-order').length;
    log(
      'Delivery after seller accept',
      deliveryEventsAfterAccept > 0 || !!afterAccept?.deliveryBoy,
      `deliveryBoy=${afterAccept?.deliveryBoy || 'none'} new-order emits=${deliveryEventsAfterAccept}`
    );

    // --- Delivery accept ---
    const acceptResult = await handleOrderAcceptance(
      io,
      order._id.toString(),
      deliveryBoy._id.toString()
    );
    log(
      'Delivery accept',
      acceptResult.success,
      acceptResult.message
    );

    const afterDeliveryAccept = await Order.findById(order._id);
    log(
      'Order assigned',
      afterDeliveryAccept?.deliveryBoy?.toString() === deliveryBoy._id.toString(),
      `deliveryBoy=${afterDeliveryAccept?.deliveryBoy} status=${afterDeliveryAccept?.status}`
    );

    // --- Deliver ---
    if (afterDeliveryAccept) {
      afterDeliveryAccept.status = 'Delivered';
      afterDeliveryAccept.deliveryBoyStatus = 'Delivered';
      afterDeliveryAccept.deliveredAt = new Date();
      if (afterDeliveryAccept.paymentMethod === 'COD') {
        afterDeliveryAccept.paymentStatus = 'Paid';
      }
      await afterDeliveryAccept.save();
      log('Deliver order', true, 'status=Delivered');
    }

    const final = await Order.findById(order._id);
    log(
      'Final state',
      final?.status === 'Delivered',
      `status=${final?.status} payment=${final?.paymentStatus}`
    );
  } catch (err: any) {
    log('Unhandled error', false, err?.message || String(err));
    console.error(err);
  } finally {
    // --- Cleanup ---
    try {
      if (testOrderId) {
        await OrderItem.deleteMany({ order: testOrderId });
        await Order.deleteOne({ _id: testOrderId });
        log('Cleanup order', true, `deleted order ${testOrderId}`);
      }
      if (testProductId) {
        await Product.deleteOne({ _id: testProductId });
        log('Cleanup product', true, `deleted product ${testProductId}`);
      }
    } catch (cleanupErr: any) {
      log('Cleanup', false, cleanupErr?.message || String(cleanupErr));
    }

    await mongoose.disconnect();

    console.log('\n' + '='.repeat(60));
    console.log('📋 E2E REPORT');
    console.log('='.repeat(60));
    const passed = REPORT.filter((r) => r.ok).length;
    const failed = REPORT.filter((r) => !r.ok).length;
    REPORT.forEach((r) => console.log(`${r.ok ? 'PASS' : 'FAIL'} | ${r.step} | ${r.detail}`));
    console.log('='.repeat(60));
    console.log(`Total: ${passed} passed, ${failed} failed`);
    console.log(
      failed === 0
        ? '✅ Quick order flow OK (backend). Seller ring = frontend sound unlock on live UI.'
        : '❌ Some steps failed — check above.'
    );
    console.log('='.repeat(60) + '\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

main();
