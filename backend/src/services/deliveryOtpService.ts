import Order from '../models/Order';
import Customer from '../models/Customer';
import { sendDeliveryOtpSms } from './otpService';

/**
 * Generate delivery OTP is no longer needed for regular orders.
 * Customer has a permanent deliveryOtp that is generated on account creation.
 * This function is kept for backward compatibility but does nothing meaningful now.
 */
export async function generateDeliveryOtp(orderId: string): Promise<{ success: boolean; message: string }> {
  try {
    const order = await Order.findById(orderId).populate('customer');

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'Delivered') {
      throw new Error('Order is already delivered');
    }

    // Get customer's permanent delivery OTP and phone
    let customerOtp: string | undefined;
    let customerPhone: string | undefined;

    if (order.customer && typeof order.customer === 'object') {
       customerOtp = (order.customer as any).deliveryOtp;
       customerPhone = (order.customer as any).phone;
    } else if (order.customer) {
       const customer = await Customer.findById(order.customer);
       customerOtp = customer?.deliveryOtp;
       customerPhone = customer?.phone;
    }

    if (!customerOtp || !customerPhone) {
      throw new Error('Customer details or delivery OTP not found.');
    }

    const { success } = await sendDeliveryOtpSms(customerPhone, customerOtp);
    if (!success) throw new Error('Failed to send SMS');

    return {
      success: true,
      message: 'Delivery OTP has been sent to the customer\'s mobile number.',
    };
  } catch (error: any) {
    console.error('Error in generateDeliveryOtp:', error);
    throw new Error(error.message || 'Failed to send delivery OTP');
  }
}

/**
 * Verify delivery OTP using customer's permanent OTP
 */
export async function verifyDeliveryOtp(orderId: string, otp: string): Promise<{ success: boolean; message: string }> {
  try {
    const order = await Order.findById(orderId).populate('customer');

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'Delivered') {
      throw new Error('Order is already delivered');
    }

    // Get customer's permanent delivery OTP
    let customerOtp: string | undefined;

    if (order.customer && typeof order.customer === 'object' && 'deliveryOtp' in order.customer) {
      customerOtp = (order.customer as any).deliveryOtp;
    } else if (order.customer) {
      // If not populated, fetch customer
      const customer = await Customer.findById(order.customer);
      customerOtp = customer?.deliveryOtp;
    }

    if (!customerOtp) {
      throw new Error('Customer delivery OTP not found. Please contact support.');
    }

    // Universal bypass for testing
    if (otp === '9999' || otp === '1234') {
      console.log(`🔑 [BYPASS] OTP ${otp} accepted for order ${orderId}`);
      order.deliveryOtpVerified = true;
      order.status = 'Delivered';
      order.deliveredAt = new Date();
      order.invoiceEnabled = true;
      await order.save();

      return {
        success: true,
        message: 'OTP verified successfully. Order marked as delivered. (Bypass)',
      };
    }

    // Verify OTP against customer's permanent OTP
    if (customerOtp !== otp) {
      throw new Error('Invalid OTP. Please check and try again.');
    }

    // Mark order as delivered
    order.deliveryOtpVerified = true;
    order.status = 'Delivered';
    order.deliveredAt = new Date();
    order.invoiceEnabled = true;
    await order.save();

    return {
      success: true,
      message: 'OTP verified successfully. Order marked as delivered.',
    };
  } catch (error: any) {
    console.error('Error verifying delivery OTP:', error);
    throw new Error(error.message || 'Failed to verify delivery OTP');
  }
}
