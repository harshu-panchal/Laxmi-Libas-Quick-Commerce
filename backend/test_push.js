const admin = require("firebase-admin");
const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

async function testPush() {
  try {
    // 1. Initialize Firebase
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    console.log("✅ Firebase Admin initialized");

    // 2. Connect to DB to get a token
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find a seller or delivery boy with a token
    const seller = await mongoose.connection.db.collection("sellers").findOne({
      $or: [
        { fcmTokens: { $exists: true, $not: { $size: 0 } } },
        { fcmTokenMobile: { $exists: true, $not: { $size: 0 } } }
      ]
    });

    if (!seller) {
      console.log("❌ No seller with tokens found for testing");
      process.exit(1);
    }

    const token = (seller.fcmTokenMobile && seller.fcmTokenMobile[0]) || (seller.fcmTokens && seller.fcmTokens[0]);
    console.log(`📡 Sending test notification to: ${seller.storeName || seller.name} using token: ${token.substring(0, 20)}...`);

    const message = {
      notification: {
        title: "🔔 Test Alert",
        body: "Your notification system is working perfectly! Ringing now..."
      },
      data: {
        type: "NEW_ORDER",
        orderNumber: "TEST-123",
        click_action: "FLUTTER_NOTIFICATION_CLICK"
      },
      token: token
    };

    const response = await admin.messaging().send(message);
    console.log("✅ Successfully sent message:", response);

    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

testPush();
