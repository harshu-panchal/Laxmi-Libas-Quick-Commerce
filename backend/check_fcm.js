const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

async function checkFCM() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const collections = ["customers", "admins", "sellers", "deliveries"];
    
    for (const collName of collections) {
      const docs = await mongoose.connection.db.collection(collName).find({
        $or: [
          { fcmTokens: { $exists: true, $not: { $size: 0 } } },
          { fcmTokenMobile: { $exists: true, $not: { $size: 0 } } }
        ]
      }).toArray();

      console.log(`\n--- ${collName.toUpperCase()} ---`);
      console.log(`Users with tokens: ${docs.length}`);
      docs.forEach(doc => {
        console.log(`- ${doc.name || doc.storeName || doc.email || doc.phone || doc._id}`);
        if (doc.fcmTokens) console.log(`  Web: ${doc.fcmTokens.length} tokens`);
        if (doc.fcmTokenMobile) console.log(`  Mobile: ${doc.fcmTokenMobile.length} tokens`);
      });
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkFCM();
