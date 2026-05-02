import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        const token = jwt.sign(
            { userId: new mongoose.Types.ObjectId().toString(), userType: 'Customer' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1h' }
        );
        console.log('Token generated');
        const res = await axios.post('http://localhost:5000/api/v1/customer/orders', {
            items: [{ product: { id: new mongoose.Types.ObjectId().toString(), price: 100 }, quantity: 1 }],
            address: { city: 'Test', pincode: '123456', latitude: 0, longitude: 0 },
            paymentMethod: 'Online',
            fees: { platformFee: 0, deliveryFee: 0, ecomShippingFee: 0 },
            total: 100
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('SUCCESS:', res.data);
    } catch (e: any) {
        console.error('ERROR RESPONSE:', e.response?.data || e.message);
    }
};
run();
