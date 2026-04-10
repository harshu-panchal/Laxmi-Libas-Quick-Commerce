import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

require('./src/models/OrderItem');
const Order = require('./src/models/Order').default || require('./src/models/Order');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const o = await Order.findOne().sort({createdAt:-1}).populate('items');
    console.log("Order items:");
    console.log(JSON.stringify(o.items, null, 2));
    process.exit(0);
}
check();
