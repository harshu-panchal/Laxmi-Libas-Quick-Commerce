import mongoose from 'mongoose';
import Delivery from './src/models/Delivery';
import * as dotenv from 'dotenv';
dotenv.config();

async function approveDelivery() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/laxmi-libas');
    console.log("Connected to DB");

    // Force all delivery boys to be Approved and in Indore for testing
    const result = await Delivery.updateMany(
        {}, 
        { 
            status: 'Approved',
            isOnline: true,
            location: {
                type: 'Point',
                coordinates: [75.8756, 22.7177] // Indore
            }
        }
    );
    
    console.log(`Updated ${result.modifiedCount} delivery boys to Approved and set location.`);

    await mongoose.disconnect();
}

approveDelivery();
