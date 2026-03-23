import mongoose from 'mongoose';
import Customer from './src/models/Customer';
import Seller from './src/models/Seller';
import Delivery from './src/models/Delivery';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        
        const customer = await Customer.findOne({});
        console.log('Customer:', customer ? { id: customer._id, name: customer.name, phone: customer.phone, email: customer.email } : 'None');
        
        const seller = await Seller.findOne({});
        console.log('Seller:', seller ? { id: seller._id, name: seller.sellerName, store: seller.storeName } : 'None');
        
        const deliveryBoy = await Delivery.findOne({});
        console.log('Delivery Boy:', deliveryBoy ? { id: deliveryBoy._id, name: deliveryBoy.name, status: deliveryBoy.status } : 'None');
        
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
