import mongoose from 'mongoose';
import HeaderCategory from './src/models/HeaderCategory';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const headers = await HeaderCategory.find({});
        console.log(JSON.stringify(headers, null, 2));
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
