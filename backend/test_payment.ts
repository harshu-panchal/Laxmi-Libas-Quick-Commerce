import axios from 'axios';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        const token = jwt.sign(
            { userId: new mongoose.Types.ObjectId().toString(), userType: 'Customer' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1h' }
        );
        console.log('Sending MT orderId...');
        const res = await axios.post('http://localhost:5000/api/v1/payment/create', {
            orderId: 'MT123456789',
            amount: 100
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('SUCCESS:', res.data);
    } catch (e: any) {
        console.error('ERROR RESPONSE:', e.response?.data || e.message);
    }
};
run();
