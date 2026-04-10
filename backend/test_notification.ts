const mongoose = require("mongoose");
require("dotenv").config({ path: __dirname + "/.env" });

const Order = require("./src/models/Order").default || require("./src/models/Order");
const Seller = require("./src/models/Seller").default || require("./src/models/Seller");
const Delivery = require("./src/models/Delivery").default || require("./src/models/Delivery");
const { findDeliveryBoysNearSellerLocations } = require("./src/services/orderNotificationService");

async function testNotificationFlow() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");

        // Fetch one recent order with status 'Pending' or 'Accepted'
        const order = await Order.findOne().sort({ createdAt: -1 });
        if (!order) {
            console.log("No orders found in DB. Cannot test exactly.");
            process.exit(0);
        }

        console.log(`Checking order: ${order._id}`);
        console.log(`Initial Sellers count: ${order.items ? order.items.length : 0}`);

        console.log("Testing findDeliveryBoysNearSellerLocations...");
        // the function is imported correctly
        const deliveryBoys = await findDeliveryBoysNearSellerLocations(order);
        
        console.log("==== Test Result ====");
        console.log(`Delivery boys found for this order: ${deliveryBoys.length}`);
        if(deliveryBoys.length > 0) {
            console.log(`Order is successfully ready to broadcast to delivery boys!`);
            console.log(`Boys IDs:`, deliveryBoys);
        } else {
            console.log(`No active delivery boys found within 40km of the seller!`);
            console.log(`This is either because there are no delivery boys registered, they are offline, or they are too far away (> 40km).`);
        }

    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

testNotificationFlow();
