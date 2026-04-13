import mongoose from 'mongoose';
import Customer from '../src/models/Customer';
import Order from '../src/models/Order';
import { verifyDeliveryOtp } from '../src/services/deliveryOtpService';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to DB');

    const order = await Order.findOne({ status: { $ne: 'Delivered' } }).populate('customer');
    if (!order) {
      console.log('No eligible order found for testing.');
      return;
    }

    console.log('Testing with Order:', order._id);
    
    // Check bypass 9999
    try {
      const result = await verifyDeliveryOtp(order._id.toString(), '9999');
      console.log('Bypass 9999 Result:', result);
    } catch (e: any) {
      console.log('Bypass 9999 Expectedly Failed:', e.message);
    }

    // Check bypass 1234
    try {
      const result = await verifyDeliveryOtp(order._id.toString(), '1234');
      console.log('Bypass 1234 Result:', result);
    } catch (e: any) {
      console.log('Bypass 1234 Expectedly Failed:', e.message);
    }

    // Check actual OTP
    const customer = order.customer as any;
    if (customer && customer.deliveryOtp) {
      console.log('Testing with actual OTP:', customer.deliveryOtp);
      const result = await verifyDeliveryOtp(order._id.toString(), customer.deliveryOtp);
      console.log('Actual OTP Result:', result);
    } else {
      console.log('Customer has no deliveryOtp assigned.');
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

test();
