import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Seller from "../models/Seller";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function updateCity() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");
    
    const id = "69faf49b09470e0af914e30e";
    const result = await Seller.findByIdAndUpdate(
      id,
      { city: "Indore" },
      { new: true }
    );
    
    if (result) {
      console.log("Updated Seller City directly in DB:", result.city);
    } else {
      console.log("Seller not found");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateCity();
