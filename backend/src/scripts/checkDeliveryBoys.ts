import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Delivery from "../models/Delivery";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function checkDeliveryBoys() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");
    
    const deliveryBoys = await Delivery.find({});
    console.log(`Total Delivery Boys: ${deliveryBoys.length}`);
    
    deliveryBoys.forEach(db => {
      console.log(`- ${db.name} (ID: ${db._id}) Status: ${db.status} Online: ${db.isOnline}`);
    });

    const onlineActive = deliveryBoys.filter(db => db.isOnline && db.status === 'Active');
    console.log(`\nOnline & Active Delivery Boys: ${onlineActive.length}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDeliveryBoys();
