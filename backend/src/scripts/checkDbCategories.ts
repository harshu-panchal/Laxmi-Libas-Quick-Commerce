import mongoose from "mongoose";
import dotenv from "dotenv";
import HeaderCategory from "../models/HeaderCategory";
import Category from "../models/Category";
import SubCategory from "../models/SubCategory";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Database connected successfully!");

    const headers = await HeaderCategory.find().lean();
    console.log("\n================ HEADER CATEGORIES ================");
    console.log(`Found ${headers.length} header categories:`);
    headers.forEach(h => {
      console.log(`- [${h.status}] ${h.name} (slug: ${h.slug}, theme: ${h.theme}, _id: ${h._id})`);
    });

    const categories = await Category.find().lean();
    console.log("\n================ CATEGORIES ================");
    console.log(`Found ${categories.length} categories:`);
    categories.forEach(c => {
      console.log(`- [${c.status}] ${c.name} (slug: ${c.slug}, headerCategoryId: ${c.headerCategoryId}, parentId: ${c.parentId}, _id: ${c._id})`);
    });

    const subs = await SubCategory.find().lean();
    console.log("\n================ SUB CATEGORIES ================");
    console.log(`Found ${subs.length} sub categories:`);
    subs.forEach(s => {
      console.log(`- ${s.name} (category: ${s.category}, _id: ${s._id})`);
    });

  } catch (err: any) {
    console.error("Failed to run check script:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
