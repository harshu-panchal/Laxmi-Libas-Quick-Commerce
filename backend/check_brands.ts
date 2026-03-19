import mongoose from 'mongoose';
import Brand from './src/models/Brand';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const brands = await Brand.find({});
        console.log('Total Brands:', brands.length);
        console.log(brands.map(b => b.name));
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
