import mongoose from 'mongoose';
import { createOrder } from './src/modules/customer/controllers/customerOrderController';

const run = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/laxmart');
        const req = {
            user: { userId: new mongoose.Types.ObjectId().toString() },
            app: { get: () => null },
            body: {
                items: [{ product: { id: new mongoose.Types.ObjectId().toString() }, quantity: 1 }],
                address: { city: 'Test', latitude: 0, longitude: 0 },
                paymentMethod: 'Online',
                fees: { platformFee: 0, deliveryFee: 0, ecomShippingFee: 0 },
                total: 100
            }
        };
        const res = {
            status: (code: number) => {
                console.log('STATUS:', code);
                return {
                    json: (data: any) => console.log('JSON:', JSON.stringify(data))
                };
            }
        };
        await createOrder(req as any, res as any);
    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await mongoose.disconnect();
    }
};
run();
