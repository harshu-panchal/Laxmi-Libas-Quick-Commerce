import mongoose from "mongoose";
import dotenv from "dotenv";
import HeaderCategory from "../models/HeaderCategory";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    const headers = await HeaderCategory.find().sort({ order: 1 }).lean();
    console.log("=== HEADER CATEGORIES ===");
    headers.forEach(h => {
      console.log(`- [${h.status}] ${h.name} (slug: ${h.slug}, theme: ${h.theme}, _id: ${h._id})`);
    });
  } catch (err: any) {
    console.error(err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
