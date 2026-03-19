import mongoose from 'mongoose';
import Product from './src/models/Product';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const count = await Product.countDocuments({});
        console.log(`Total Products: ${count}`);
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
