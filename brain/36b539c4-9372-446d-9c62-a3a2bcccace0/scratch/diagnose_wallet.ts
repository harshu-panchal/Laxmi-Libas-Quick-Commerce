
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log("Connected to DB");

        const Delivery = mongoose.model('Delivery', new mongoose.Schema({}, { strict: false }));
        const PlatformWallet = mongoose.model('PlatformWallet', new mongoose.Schema({}, { strict: false }));
        const WalletTransaction = mongoose.model('WalletTransaction', new mongoose.Schema({}, { strict: false }));
        const Commission = mongoose.model('Commission', new mongoose.Schema({}, { strict: false }));

        // 1. Check Platform Wallet
        const pw = await PlatformWallet.findOne();
        console.log("\n--- Platform Wallet ---");
        console.log(JSON.stringify(pw, null, 2));

        // 2. Check Delivery Boys with pending debt
        const boys = await Delivery.find({ pendingAdminPayout: { $gt: 0 } }).select('name pendingAdminPayout balance');
        console.log("\n--- Delivery Boys with Debt ---");
        console.log(boys);

        // 3. Check recent transactions
        const txs = await WalletTransaction.find({ 
            createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
        }).sort({ createdAt: -1 }).limit(5);
        console.log("\n--- Recent Transactions (24h) ---");
        console.log(txs);

        // 4. Check Pending Commissions
        const pendingCommCount = await Commission.countDocuments({ status: 'Pending', type: 'SELLER' });
        console.log("\n--- Pending Seller Commissions Count ---");
        console.log(pendingCommCount);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

diagnose();
