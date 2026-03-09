import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Connected to", mongoose.connection.name);

    const collections = await mongoose.connection.db.listCollections().toArray();
    for (let c of collections) {
        const count = await mongoose.connection.db.collection(c.name).countDocuments();
        if (count > 0) {
            console.log(`Collection ${c.name} has ${count} documents`);
        }
    }
    process.exit(0);
}

check().catch(console.error);
