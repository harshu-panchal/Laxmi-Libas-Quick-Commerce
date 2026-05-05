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

    if (!customerPhone) {
      throw new Error('Customer phone number not found. Cannot generate delivery code.');
    }

    if (!customerOtp) {
      console.log('Generating missing delivery OTP for customer:', customerPhone);
      customerOtp = customerPhone.slice(-4);
      
      // Persist it back to the customer record for future use
      if (order.customer && typeof order.customer === 'object') {
        const customer = await Customer.findById((order.customer as any)._id);
        if (customer) {
          customer.deliveryOtp = customerOtp;
          await customer.save();
        }
      } else if (order.customer) {
        const customer = await Customer.findById(order.customer);
        if (customer) {
          customer.deliveryOtp = customerOtp;
          await customer.save();
        }
      }
    }

    try {
      const { success } = await sendDeliveryOtpSms(customerPhone, customerOtp);
      if (!success) throw new Error('Failed to send SMS');
    } catch (smsError: any) {
      console.warn('⚠️ Delivery OTP SMS failed, but proceeding since fixed OTP is used:', smsError.message);
      return {
        success: true,
        message: 'Delivery code is the LAST 4 DIGITS of the customer\'s phone number. No SMS needed.',
      };
    }

    return {
      success: true,
      message: 'Delivery code is ready. Customer can verify using the last 4 digits of their phone number.',
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

    if (!customerOtp) {
      throw new Error('Customer delivery OTP not found. Please contact support.');
    }

    // Verify OTP against customer's permanent OTP OR last 4 digits of phone as fallback
    const phoneLast4 = customerPhone ? customerPhone.slice(-4) : null;
    
    if (customerOtp !== otp && phoneLast4 !== otp) {
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
