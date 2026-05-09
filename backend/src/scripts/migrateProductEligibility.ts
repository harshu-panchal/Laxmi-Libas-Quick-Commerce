import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Database connected successfully!");

    // Update products directly using updateMany for fast bulk synchronization
    const result1 = await Product.updateMany(
      { type: { $in: ["quick", "both"] } },
      { $set: { isQuickEligible: true, deliveryType: "quick" } }
    );
    console.log("Updated Quick/Both products:", result1);

    const result2 = await Product.updateMany(
      { type: "ecommerce" },
      { $set: { isQuickEligible: false, deliveryType: "ecommerce" } }
    );
    console.log("Updated Ecommerce products:", result2);

    // Double-check stats
    const quickEligibleCount = await Product.countDocuments({ isQuickEligible: true });
    console.log("Total products after sync:", await Product.countDocuments());
    console.log("Quick eligible products after sync:", quickEligibleCount);

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
