import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Seller from "../models/Seller";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function findApprovedSeller() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");
    
    const seller = await Seller.findOne({ status: "Active" }); // Checking for Active/Approved sellers
    if (seller) {
      console.log(`Found Seller: ${seller.sellerName} (ID: ${seller._id})`);
    } else {
      const anySeller = await Seller.findOne();
      if (anySeller) {
        console.log(`Found any Seller: ${anySeller.sellerName} (ID: ${anySeller._id})`);
      } else {
        console.log("No sellers found");
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findApprovedSeller();
