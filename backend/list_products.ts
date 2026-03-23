import mongoose from 'mongoose';
import Product from './src/models/Product';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function listProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const products = await Product.find({}).select('productName seller price discPrice');
        console.log('Products:', JSON.stringify(products, null, 2));
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listProducts();
