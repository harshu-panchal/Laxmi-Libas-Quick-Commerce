const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

async function run() {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/laxmi-libaas";
    console.log("Connecting to MONGODB_URI:", uri);
    
    await mongoose.connect(uri);

    try {
        const db = mongoose.connection.db;
        const ordersCollection = db.collection("orders");
        const orderitemsCollection = db.collection("orderitems");

        const targetId = "69fec7dcd4168986e7d41729";
        console.log("\n--- INSPECTING ORDER: " + targetId + " ---");
        
        const order = await ordersCollection.findOne({ _id: new mongoose.Types.ObjectId(targetId) });
        if (!order) {
            console.log("❌ Order not found in database!");
        } else {
            console.log("Order found:");
            console.log("  Order Number:", order.orderNumber);
            console.log("  Status:", order.status);
            console.log("  Order Type:", order.orderType);
            console.log("  Payment Method:", order.paymentMethod);
            console.log("  Payment Status:", order.paymentStatus);
            console.log("  Customer Name:", order.customerName);
            console.log("  Customer ID:", order.customer);
            console.log("  Courier Partner:", order.courierPartner);
            console.log("  Tracking ID:", order.trackingId);
        }

        console.log("\n--- INSPECTING ORDER ITEMS FOR THIS ORDER ---");
        const items = await orderitemsCollection.find({ order: new mongoose.Types.ObjectId(targetId) }).toArray();
        console.log("Found " + items.length + " items in order:");
        items.forEach((item, idx) => {
            console.log(`  Item ${idx + 1}:`);
            console.log("    ID:", item._id);
            console.log("    Product Name:", item.productName);
            console.log("    Seller:", item.seller);
            console.log("    Quantity:", item.quantity);
            console.log("    Total Price:", item.total);
        });

    } catch (err) {
        console.error("❌ Error running inspection:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
