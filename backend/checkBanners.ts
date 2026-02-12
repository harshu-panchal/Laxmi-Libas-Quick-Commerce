
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Banner from './src/models/Banner';

dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const banners = await Banner.find();
        console.log('Banners count:', banners.length);
        console.log(JSON.stringify(banners, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
