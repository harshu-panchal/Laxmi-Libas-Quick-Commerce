import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Order from "../models/Order";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function checkActiveOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");
    
    const activeOrders = await Order.find({
      status: { $nin: ['Delivered', 'Cancelled', 'Rejected', 'Returned'] },
      deliveryBoy: { $exists: true }
    });
    console.log(`Total Active Orders with Delivery Boy: ${activeOrders.length}`);
    
    activeOrders.forEach(o => {
      console.log(`- Order: ${o.orderNumber} Status: ${o.status} DeliveryBoy: ${o.deliveryBoy} Created: ${o.createdAt}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkActiveOrders();
