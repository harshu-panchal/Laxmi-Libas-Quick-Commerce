import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product";

dotenv.config();

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    await mongoose.connect(mongoUri);
    console.log("Database connected successfully!");

    const products = await Product.find();
    console.log(`Found ${products.length} products. Commencing bidirectional relationship mapping synchronization...`);

    let syncCount = 0;
    for (const product of products) {
      try {
        // Mark fields as modified to guarantee pre-save hook runs
        product.markModified("category");
        product.markModified("subcategory");
        product.markModified("seller");
        
        await product.save();
        syncCount++;
        console.log(`[${syncCount}/${products.length}] Successfully synchronized relations for: "${product.productName || (product as any).name}"`);
      } catch (saveErr: any) {
        console.error(`Failed to sync product "${product._id}":`, saveErr.message);
      }
    }

    console.log(`\n🎉 Done! Synchronized relations for ${syncCount} products successfully.`);
  } catch (err: any) {
    console.error("Migration/Sync script failed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed.");
  }
}

run();
