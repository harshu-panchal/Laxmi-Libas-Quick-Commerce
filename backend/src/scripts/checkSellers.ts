import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Seller from "../models/Seller";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function checkSellers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");
    
    const sellers = await Seller.find({});
    console.log(`Total Sellers: ${sellers.length}`);
    
    sellers.forEach(s => {
      console.log(`- ${s.storeName} (ID: ${s._id}) Loc: ${s.latitude}, ${s.longitude} Radius: ${s.serviceRadiusKm}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSellers();
