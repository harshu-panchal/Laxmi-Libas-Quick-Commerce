import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../src/models/Category";
import SubCategory from "../src/models/SubCategory";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/NewDatabaseName";

async function main() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const catId = "69f5ebaf162529539725eafe";
  const subcatId = "69f5ebe3162529539725eb93";

  const catInCat = await Category.findById(catId);
  console.log("Category ID in Category model:", catInCat ? catInCat.name : "NOT FOUND");

  const subInCat = await Category.findById(subcatId);
  console.log("Subcategory ID in Category model:", subInCat ? subInCat.name : "NOT FOUND");

  const subInSub = await SubCategory.findById(subcatId);
  console.log("Subcategory ID in SubCategory model:", subInSub ? subInSub.name : "NOT FOUND");

  // Let's list all Category names
  const allCats = await Category.find().select("name slug parentId");
  console.log("\n=== ALL CATEGORIES ===");
  allCats.forEach(c => {
    console.log(`- ${c.name} (${c._id}) slug: ${c.slug} parent: ${c.parentId}`);
  });

  // Let's list all SubCategory names
  const allSubs = await SubCategory.find().populate("category", "name");
  console.log("\n=== ALL SUBCATEGORIES ===");
  allSubs.forEach(s => {
    console.log(`- ${s.name} (${s._id}) category: ${s.category ? (s.category as any).name : "N/A"}`);
  });

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
