const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("❌ MONGODB_URI not found");
        process.exit(1);
    }

    await mongoose.connect(uri);
    try {
        const db = mongoose.connection.db;
        const ordersCollection = db.collection("orders");

        const orderId = new mongoose.Types.ObjectId("69fdb19537ef103b137d79f3");
        await ordersCollection.updateOne(
            { _id: orderId },
            {
                $set: { status: "Accepted" },
                $unset: { trackingStatus: "", trackingId: "", courierPartner: "" },
                $pull: { trackingHistory: { status: "Shipped" } }
            }
        );

        console.log("✅ Order 69fdb19537ef103b137d79f3 successfully reset to 'Accepted' in database!");

    } catch (err) {
        console.error("❌ Error resetting order:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
