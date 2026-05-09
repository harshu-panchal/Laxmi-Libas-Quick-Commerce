import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Order from "../src/models/Order";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("❌ MONGODB_URI not found");
        process.exit(1);
    }

    await mongoose.connect(uri);

    try {
        const orderId = "69fdb19537ef103b137d79f3";
        const order = await Order.findById(orderId);

        if (!order) {
            console.error("❌ Order not found.");
            process.exit(1);
        }

        console.log("\n📦 Simulating markAsPacked on Order (using live TS src/):", order.orderNumber);
        console.log("Starting Status:", order.status);

        // Reset trackingStatus for test
        order.trackingStatus = undefined;

        // Perform mock pack action
        order.status = 'Packed';
        if (!order.trackingHistory) order.trackingHistory = [];
        order.trackingHistory.push({
            status: 'Packed',
            location: 'Seller Warehouse',
            description: 'Order packed and ready to ship',
            timestamp: new Date()
        });

        // Simulating the automatic Courier Delhivery assignment
        if (order.orderType === 'ecommerce') {
            console.log("🚚 Order is 'ecommerce'. Setting trackingStatus to 'SHIPPED'...");
            order.status = 'Shipped';
            order.trackingId = "WAYBILL123456789";
            order.courierPartner = "Delhivery";
            order.trackingStatus = "SHIPPED"; // This is the exact value that was failing!

            order.trackingHistory.push({
                status: 'Shipped',
                location: 'Seller Warehouse',
                description: 'Shipment automatically registered with Delhivery. Waybill: WAYBILL123456789',
                timestamp: new Date()
            });
        }

        // Try to save the order
        try {
            await order.save();
            console.log("\n✅ SUCCESS: Order saved to database without any validation errors!");
            console.log("Ending Status:", order.status);
            console.log("Ending trackingStatus:", order.trackingStatus);
        } catch (saveError: any) {
            console.error("\n❌ FAILED TO SAVE:", saveError.message);
            if (saveError.errors) {
                for (const field in saveError.errors) {
                    console.error(`Field [${field}]:`, saveError.errors[field].message);
                }
            }
        }

    } catch (err) {
        console.error("❌ Error running simulation:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
