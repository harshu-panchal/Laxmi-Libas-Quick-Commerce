import mongoose from 'mongoose';
import Order from './src/models/Order';
import OrderItem from './src/models/OrderItem';
import Product from './src/models/Product';
import Customer from './src/models/Customer';
import Seller from './src/models/Seller';
import Delivery from './src/models/Delivery';
import DeliveryAssignment from './src/models/DeliveryAssignment';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function verifyFlow() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        // 1. Setup Test Data
        const customer = await Customer.findOne({ phone: '9999999999' });
        const seller = await Seller.findById("69bd2e16ed751652e89c103c");
        const deliveryBoy = await Delivery.findOne({ name: 'Delivery Jack' });
        const product = await Product.findById("69bd3423ed751652e89c19e4");

        if (!customer) console.error('Customer not found');
        if (!seller) console.error('Seller not found');
        if (!deliveryBoy) console.error('Delivery Boy not found');
        if (!product) console.error('Product not found');

        if (!customer || !seller || !deliveryBoy || !product) {
            return;
        }

        console.log('Test Data Ready:', {
            customer: customer.name,
            seller: seller.storeName,
            deliveryBoy: deliveryBoy.name,
            product: product.productName
        });

        const orderNumber = `TEST-${Date.now()}`;

        // 2. Simulate Order Placement
        console.log('\n--- Step 1: Placing Order ---');
        const newOrder = new Order({
            orderNumber,
            customer: customer._id,
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            deliveryAddress: {
                address: '123 Test Street',
                city: 'Test City',
                state: 'Test State',
                pincode: '123456',
                latitude: 28.5355,
                longitude: 77.3910
            },
            paymentMethod: 'COD',
            paymentStatus: 'Pending',
            status: 'Received',
            subtotal: product.discPrice || product.price,
            total: (product.discPrice || product.price) + 50, // subtotal + fee
            shipping: 50,
            platformFee: 0,
            orderDate: new Date()
        });

        const newOrderItem = new OrderItem({
            order: newOrder._id,
            product: product._id,
            seller: seller._id,
            productName: product.productName,
            unitPrice: product.discPrice || product.price,
            quantity: 1,
            total: product.discPrice || product.price,
            status: 'Pending'
        });

        await newOrderItem.save();
        newOrder.items = [newOrderItem._id as any];
        await newOrder.save();
        console.log(`Order placed successfully: ${newOrder.orderNumber}`);

        // 3. Simulate Admin Assignment
        console.log('\n--- Step 2: Admin Assigning Delivery Boy ---');
        newOrder.deliveryBoy = deliveryBoy._id as any;
        newOrder.deliveryBoyStatus = 'Assigned';
        newOrder.assignedAt = new Date();
        await newOrder.save();

        await DeliveryAssignment.findOneAndUpdate(
            { order: newOrder._id },
            {
                order: newOrder._id,
                deliveryBoy: deliveryBoy._id,
                assignedAt: new Date(),
                status: 'Assigned',
            },
            { upsert: true, new: true }
        );
        console.log(`Delivery boy ${deliveryBoy.name} assigned to order.`);

        // 4. Simulate Delivery Boy - Seller Pickup
        console.log('\n--- Step 3: Delivery Boy Confirming Pickup ---');
        // Logic from deliveryOrderController.confirmSellerPickup
        newOrder.sellerPickups = [{
            seller: seller._id as any,
            pickedUpAt: new Date(),
            pickedUpBy: deliveryBoy._id as any,
            latitude: 28.5355,
            longitude: 77.3910
        }];
        
        // Since it's the only seller, status changes to "Out for Delivery"
        newOrder.status = 'Out for Delivery';
        newOrder.deliveryBoyStatus = 'In Transit';
        await newOrder.save();
        console.log('Pickup confirmed. Status changed to "Out for Delivery".');

        // 5. Simulate Delivery Boy - Deliver Order
        console.log('\n--- Step 4: Delivering Order ---');
        // Generate OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        // We simulate the verification success
        console.log(`Generated OTP: ${otp}`);
        newOrder.status = 'Delivered';
        newOrder.deliveryBoyStatus = 'Delivered';
        newOrder.deliveredAt = new Date();
        newOrder.paymentStatus = 'Paid';
        await newOrder.save();
        console.log('Order delivered successfully. Status changed to "Delivered".');

        // 6. Final verification
        const finalOrder = await Order.findById(newOrder._id);
        console.log('\nFinal Order Status:', finalOrder?.status);
        console.log('Payment Status:', finalOrder?.paymentStatus);
        console.log('Delivery Boy Status:', finalOrder?.deliveryBoyStatus);

        await mongoose.connection.close();
        console.log('\nVerification script completed successfully.');

    } catch (err) {
        console.error('Verification failed:', err);
        process.exit(1);
    }
}

verifyFlow();
