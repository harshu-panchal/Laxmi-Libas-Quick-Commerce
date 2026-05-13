import mongoose from "mongoose";
import dotenv from "dotenv";
import HeaderCategory from "../models/HeaderCategory";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    const headers = await HeaderCategory.find().sort({ order: 1 }).lean();
    console.log("=== HEADER CATEGORIES WITH ICONS ===");
    headers.forEach(h => {
      console.log(`Name: "${h.name}"`);
      console.log(`  _id: ${h._id}`);
      console.log(`  slug: "${h.slug}"`);
      console.log(`  theme: "${h.theme}"`);
      console.log(`  iconName: "${h.iconName}"`);
      console.log(`  iconLibrary: "${h.iconLibrary}"`);
      console.log(`  status: "${h.status}"`);
      console.log(`-----------------------------------`);
    });
  } catch (err: any) {
    console.error(err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
