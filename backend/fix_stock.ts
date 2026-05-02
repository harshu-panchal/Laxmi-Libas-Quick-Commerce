import mongoose from 'mongoose';
import Product from './src/models/Product';
import * as dotenv from 'dotenv';
dotenv.config();

async function fixStock() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/laxmi-libas');
    console.log("Connected to DB");

    const product = await Product.findOne({ productName: /T-novel/i });
    if (product) {
        console.log(`Found product: ${product.productName}, current stock: ${product.stock}`);
        product.stock = 100;
        product.stockLocks = []; // Clear any old locks
        await product.save();
        console.log("Stock updated to 100 and locks cleared.");
    } else {
        console.log("Product 'T-novel' not found");
    }

    await mongoose.disconnect();
}

fixStock();
