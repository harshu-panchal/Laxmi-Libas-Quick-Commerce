import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product";
import Category from "../models/Category";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Database connected successfully!");

    const categories = await Category.find().lean();
    console.log("ALL CATEGORIES COUNT:", categories.length);
    
    const killerCat = categories.find((c: any) => c.slug === "killer" || c.name.toLowerCase() === "killer");
    console.log("KILLER CATEGORY FOUND:", killerCat);

    const products = await Product.find().lean();
    console.log("TOTAL PRODUCTS IN DB:", products.length);

    const jeansProducts = products.filter((p: any) => 
      (p.productName || "").toLowerCase().includes("jeans") || 
      (p.description || "").toLowerCase().includes("jeans")
    );
    
    console.log(`FOUND ${jeansProducts.length} JEANS PRODUCTS:`);
    jeansProducts.forEach((p: any, i: number) => {
      console.log(`[${i}] Name: ${p.productName}`);
      console.log(`    Status: ${p.status}, Publish: ${p.publish}`);
      console.log(`    mainImage: "${p.mainImage}"`);
      console.log(`    galleryImages:`, p.galleryImages);
      console.log(`    imageUrl: "${p.imageUrl}"`);
      console.log(`    category:`, p.category);
      console.log(`    categoryId:`, p.categoryId);
    });

  } catch (err) {
    console.error("Execution failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
