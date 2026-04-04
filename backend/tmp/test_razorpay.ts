import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const keyId = process.env.RAZORPAY_KEY_ID?.trim();
const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

const razorpay = new Razorpay({
    key_id: keyId as string,
    key_secret: keySecret as string,
});

async function testOrder() {
    try {
        const options = {
            amount: 23900, // Rs 239
            currency: 'INR',
            receipt: 'test_receipt_' + Date.now(),
        };

        console.log('Attempting to create a test order for Rs 239...');
        const order = await razorpay.orders.create(options);
        console.log('✅ Success! Order created:', order.id);
    } catch (error: any) {
        console.log('❌ Error! Razorpay returned:');
        console.log('  Message:', error.message);
        console.log('  Description:', error.description);
    }
}

testOrder();
