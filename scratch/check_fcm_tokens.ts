import mongoose from "mongoose";
import "dotenv/config";
import path from "path";

// Define simplified schemas for checking tokens
const userSchema = new mongoose.Schema({
    fcmTokens: [String],
    fcmTokenMobile: [String],
    email: String,
    phone: String,
    name: String,
    storeName: String // For sellers
}, { strict: false });

async function checkFCMTokens() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error("MONGODB_URI not found");
            return;
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUri);
        console.log("✅ Connected to MongoDB");

        const collections = ["customers", "admins", "sellers", "deliveries"];
        
        for (const collName of collections) {
            const Model = mongoose.model(collName, userSchema, collName);
            
            // Find users who have at least one token
            const usersWithTokens = await Model.find({
                $or: [
                    { fcmTokens: { $exists: true, $not: { $size: 0 } } },
                    { fcmTokenMobile: { $exists: true, $not: { $size: 0 } } }
                ]
            }).lean();

            console.log(`\n--- ${collName.toUpperCase()} ---`);
            console.log(`Total users with tokens: ${usersWithTokens.length}`);

            usersWithTokens.forEach(user => {
                const identifier = user.name || user.storeName || user.email || user.phone || user._id;
                console.log(`- User: ${identifier}`);
                if (user.fcmTokens && user.fcmTokens.length > 0) {
                    console.log(`  Web Tokens (${user.fcmTokens.length}): ${user.fcmTokens[0].substring(0, 20)}...`);
                }
                if (user.fcmTokenMobile && user.fcmTokenMobile.length > 0) {
                    console.log(`  Mobile Tokens (${user.fcmTokenMobile.length}): ${user.fcmTokenMobile[0].substring(0, 20)}...`);
                }
            });
        }

        await mongoose.disconnect();
        console.log("\nDisconnected from MongoDB");
    } catch (err) {
        console.error("❌ Error:", err);
    }
}

checkFCMTokens();
