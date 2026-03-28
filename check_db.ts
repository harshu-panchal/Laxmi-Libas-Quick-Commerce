import mongoose from "mongoose";
import Category from "../backend/src/models/Category";
import SubCategory from "../backend/src/models/SubCategory";
import "dotenv/config";

async function checkCategories() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("MONGODB_URI not found");
      return;
    }
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const categories = await Category.find({ name: /Clothing/i });
    console.log("Categories named 'Clothing':");
    for (const cat of categories) {
      console.log(`- ${cat.name} (${cat._id}) Status: ${cat.status} ParentId: ${cat.parentId}`);
      
      const categoryChildren = await Category.find({ parentId: cat._id });
      console.log(`  L1 Categories (with parentId): ${categoryChildren.length}`);
      categoryChildren.forEach(c => console.log(`    - ${c.name} (${c._id}) Status: ${c.status}`));
      
      const subCategories = await SubCategory.find({ category: cat._id });
      console.log(`  Subcategories (old model): ${subCategories.length}`);
      subCategories.forEach(s => console.log(`    - ${s.name} (${s._id})`));
    }

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkCategories();
