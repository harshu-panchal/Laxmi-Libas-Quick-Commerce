import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function manualCorrection() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        const PlatformWallet = mongoose.connection.collection('platformwallets');
        const Delivery = mongoose.connection.collection('deliveries');
        const Commission = mongoose.connection.collection('commissions');

        // 1. Correct the Platform Wallet
        const amountToCredit = 1090.9;
        const wallet = await PlatformWallet.findOne();
        if (wallet) {
            console.log(`Updating Platform Wallet from ${wallet.totalPlatformEarning} to ${wallet.totalPlatformEarning + amountToCredit}`);
            await PlatformWallet.updateOne(
                { _id: wallet._id },
                {
                    $inc: {
                        totalPlatformEarning: amountToCredit,
                        currentPlatformBalance: amountToCredit,
                        pendingFromDeliveryBoy: -amountToCredit
                    }
                }
            );
        }

        // 2. Reduce the delivery man's debt
        const deliveryManId = '69d934f937cf31b5561079fb'; // From previous diagnostic
        console.log(`Reducing debt for delivery man ${deliveryManId}`);
        await Delivery.updateOne(
            { _id: new mongoose.Types.ObjectId(deliveryManId) },
            { $set: { pendingAdminPayout: 0 } }
        );

        // 3. Mark the pending commissions as Paid
        const Orders = mongoose.connection.collection('orders');
        const boyOrders = await Orders.find({ deliveryBoy: new mongoose.Types.ObjectId(deliveryManId), paymentMethod: 'COD' }).toArray();
        const orderIds = boyOrders.map(o => o._id);
        
        if (orderIds.length > 0) {
            const res = await Commission.updateMany(
                { order: { $in: orderIds }, status: 'Pending' },
                { $set: { status: 'Paid', paidAt: new Date() } }
            );
            console.log(`Updated ${res.modifiedCount} commissions to Paid.`);
        }

        console.log('Manual correction completed successfully!');
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

manualCorrection();
