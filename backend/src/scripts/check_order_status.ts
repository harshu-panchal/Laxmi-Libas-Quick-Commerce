import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const OrderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model('Order', OrderSchema, 'orders');

async function checkOrder() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to DB');
        
        const orderId = '69d9debf3d7a69085df890d3';
        const order = await Order.findById(orderId);
        
        if (!order) {
            console.log('Order not found');
        } else {
            console.log('Order Status:', order.get('status'));
            console.log('Delivery Boy ID:', order.get('deliveryBoy'));
            console.log('Delivery Boy Status:', order.get('deliveryBoyStatus'));
        }
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkOrder();
