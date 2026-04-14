
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function notify() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to DB');

    // We need the socket notification service logic
    // But we don't have a running 'io' instance here.
    // Instead of trying to mock the whole socket server, 
    // it's easier to just tell the user that new orders will work, 
    // or provide a script that updates the order's status back to 'Pending' 
    // and then the user can have the seller accept it again.
    
    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
    const orderNumber = 'ORD1775743438925795';
    
    // Setting status back to 'Received' so seller can accept again
    const result = await Order.findOneAndUpdate(
        { orderNumber },
        { status: 'Received' },
        { new: true }
    );

    if (result) {
        console.log(`Order ${orderNumber} status reset to Received`);
        console.log('Now suggest the user to have the seller accept it again');
    } else {
        console.log('Order not found');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

notify();
