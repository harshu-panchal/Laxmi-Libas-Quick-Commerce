import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product";
import Seller from "../models/Seller";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Database connected successfully!");

    const sellers = await Seller.find().lean();
    console.log('SELLERS:', sellers.map((s: any) => ({
      _id: s._id,
      storeName: s.storeName,
      city: s.city,
      status: s.status,
      isActive: s.isActive
    })));

    const products = await Product.find().lean();
    console.log('PRODUCTS:', products.map((p: any) => ({
      name: p.productName || p.name,
      type: p.type,
      isQuickEligible: p.isQuickEligible,
      status: p.status,
      publish: p.publish,
      seller: p.seller
    })));

  } catch (err) {
    console.error("Execution failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
