import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function checkWalletStats() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        const PlatformWallet = mongoose.connection.collection('platformwallets');
        const Delivery = mongoose.connection.collection('deliveries');
        const Commission = mongoose.connection.collection('commissions');

        const wallet = await PlatformWallet.findOne();
        console.log('\n--- Platform Wallet ---');
        console.log(JSON.stringify(wallet, null, 2));

        const deliveries = await Delivery.find({ pendingAdminPayout: { $gt: 0 } }).toArray();
        console.log('\n--- Deliveries with Pending Payouts ---');
        deliveries.forEach((d: any) => {
            console.log(`${d.name || d._id}: ₹${d.pendingAdminPayout}`);
        });

        const sumPending = await Delivery.aggregate([
            { $group: { _id: null, total: { $sum: '$pendingAdminPayout' } } }
        ]).toArray();
        console.log('\nAggregate Pending from Deliveries:', sumPending[0]?.total || 0);

        const pendingComms = await Commission.find({ status: 'Pending' }).limit(5).toArray();
        console.log('\n--- Pending Commissions (Sample) ---');
        console.log(JSON.stringify(pendingComms, null, 2));

        const commStats = await Commission.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$commissionAmount' } } }
        ]).toArray();
        console.log('\n--- Commission Stats ---');
        console.log(JSON.stringify(commStats, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkWalletStats();
