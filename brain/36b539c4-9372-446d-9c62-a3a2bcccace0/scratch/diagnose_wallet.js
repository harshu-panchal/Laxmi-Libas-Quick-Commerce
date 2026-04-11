
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

async function diagnose() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error("MONGODB_URI not found in env");
            return;
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const Delivery = mongoose.connection.collection('deliveries');
        const PlatformWallet = mongoose.connection.collection('platformwallets');
        const WalletTransaction = mongoose.connection.collection('wallettransactions');
        const Commission = mongoose.connection.collection('commissions');

        // 1. Check Platform Wallet
        const pw = await PlatformWallet.findOne({});
        console.log("\n--- Platform Wallet ---");
        console.log(JSON.stringify(pw, null, 2));

        // 2. Check Delivery Boys with pending debt
        const boys = await Delivery.find({ pendingAdminPayout: { $gt: 0 } }).project({ name: 1, pendingAdminPayout: 1, balance: 1 }).toArray();
        console.log("\n--- Delivery Boys with Debt ---");
        console.log(boys);

        // 3. Check recent transactions
        const txs = await WalletTransaction.find({ 
            createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
        }).sort({ createdAt: -1 }).limit(10).toArray();
        console.log("\n--- Recent Transactions (24h) ---");
        console.log(txs);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

diagnose();
