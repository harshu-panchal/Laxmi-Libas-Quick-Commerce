
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product";
import Category from "../models/Category";
import HeaderCategory from "../models/HeaderCategory";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/laxmart";

async function fixMappings() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully.");

    // 1. Get all Header Categories
    const headers = await HeaderCategory.find({ status: "Published" });
    console.log(`Found ${headers.length} published header categories.`);

    const headerMap = new Map();
    headers.forEach(h => {
      headerMap.set(h.name.toLowerCase().trim(), h._id);
      headerMap.set(h.slug.toLowerCase().trim(), h._id);
    });

    // 2. Fix Categories
    console.log("Checking all categories for missing or incorrect headerCategoryId...");
    const categories = await Category.find({});
    let catFixed = 0;

    for (const cat of categories) {
      let changed = false;
      
      const matchedHeaderId = headerMap.get(cat.name.toLowerCase().trim()) || 
                             headerMap.get(cat.slug?.toLowerCase().trim());
      
      if (matchedHeaderId) {
        if (!cat.headerCategoryId || cat.headerCategoryId.toString() !== matchedHeaderId.toString()) {
          cat.headerCategoryId = matchedHeaderId;
          changed = true;
        }
      }

      if (changed) {
        await cat.save();
        catFixed++;
      }
    }
    console.log(`Updated ${catFixed} categories.`);

    // Refresh category map to find headerCategoryId easily
    const updatedCategories = await Category.find({}).lean();
    const catToHeaderMap = new Map();
    updatedCategories.forEach(c => {
      if (c.headerCategoryId) {
        catToHeaderMap.set(c._id.toString(), c.headerCategoryId.toString());
      }
    });

    // 3. Fix Products
    console.log("Checking all products for missing or incorrect headerCategoryId...");
    const products = await Product.find({ status: "Active" });
    let prodFixed = 0;

    for (const prod of products) {
      let changed = false;
      const catIdString = prod.category?.toString();
      
      if (catIdString && catToHeaderMap.has(catIdString)) {
        const expectedHeaderId = catToHeaderMap.get(catIdString);
        
        if (!prod.headerCategoryId || prod.headerCategoryId.toString() !== expectedHeaderId) {
          prod.headerCategoryId = new mongoose.Types.ObjectId(expectedHeaderId);
          changed = true;
        }
      }

      if (changed) {
        await prod.save();
        prodFixed++;
      }
    }
    console.log(`Updated ${prodFixed} products.`);

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

fixMappings();
