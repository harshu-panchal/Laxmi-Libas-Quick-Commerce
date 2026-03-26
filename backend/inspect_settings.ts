
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AppSettings from './src/models/AppSettings';

dotenv.config();

async function checkSettings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const settings = await AppSettings.findOne();
        console.log("Current App Settings:", JSON.stringify(settings, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSettings();
