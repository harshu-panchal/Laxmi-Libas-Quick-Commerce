import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Seller from "../models/Seller";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function checkSeller() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");
    
    const id = "69faf49b09470e0af914e30e";
    const seller = await Seller.findById(id);
    if (seller) {
      console.log("Seller Info from Database:");
      console.log(JSON.stringify(seller.toObject(), null, 2));
    } else {
      console.log(`Seller with ID ${id} not found.`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSeller();
