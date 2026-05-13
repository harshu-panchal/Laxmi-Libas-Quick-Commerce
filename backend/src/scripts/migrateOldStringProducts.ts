import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/Category";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/laxmart";

async function migrateOldStringProducts() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully.");

    // Fetch all categories
    const categories = await Category.find({});
    console.log(`Found ${categories.length} categories in the database.`);

    const categoryMap = new Map<string, mongoose.Types.ObjectId>();
    categories.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase().trim(), cat._id as mongoose.Types.ObjectId);
      if (cat.slug) {
        categoryMap.set(cat.slug.toLowerCase().trim(), cat._id as mongoose.Types.ObjectId);
      }
    });

    // Access raw collection to avoid Mongoose casting errors when reading invalid ObjectIds
    const db = mongoose.connection.db!;
    const productsCollection = db.collection("products");
    
    const rawProducts = await productsCollection.find({}).toArray();
    console.log(`Found ${rawProducts.length} raw products to check.`);

    let migrationCount = 0;

    for (const rawProd of rawProducts) {
      let updateDoc: any = {};
      let needsUpdate = false;

      // Check if category is a string
      let categoryVal = rawProd.category;

      let resolvedCategoryId: mongoose.Types.ObjectId | null = null;

      if (typeof categoryVal === "string") {
        console.log(`[Migration] Product "${rawProd.productName}" has legacy string category: "${categoryVal}"`);
        const cleanName = categoryVal.toLowerCase().trim();
        if (categoryMap.has(cleanName)) {
          resolvedCategoryId = categoryMap.get(cleanName)!;
        } else {
          // Fallback or create category if it doesn't exist
          // Let's search for partial match
          const keys = Array.from(categoryMap.keys());
          const matchKey = keys.find(k => k.includes(cleanName) || cleanName.includes(k));
          if (matchKey) {
            resolvedCategoryId = categoryMap.get(matchKey)!;
          }
        }

        if (resolvedCategoryId) {
          updateDoc.category = resolvedCategoryId;
          updateDoc.categoryId = resolvedCategoryId;
          needsUpdate = true;
          console.log(` -> Mapped string category "${categoryVal}" to ObjectId "${resolvedCategoryId}"`);
        } else {
          console.log(` -> ⚠️ Could not find category match for string: "${categoryVal}"`);
        }
      }

      // Check subcategory
      let subcategoryVal = rawProd.subcategory;
      if (typeof subcategoryVal === "string") {
        console.log(`[Migration] Product "${rawProd.productName}" has legacy string subcategory: "${subcategoryVal}"`);
        const cleanName = subcategoryVal.toLowerCase().trim();
        let resolvedSubCategoryId: mongoose.Types.ObjectId | null = null;

        if (categoryMap.has(cleanName)) {
          resolvedSubCategoryId = categoryMap.get(cleanName)!;
        } else {
          const keys = Array.from(categoryMap.keys());
          const matchKey = keys.find(k => k.includes(cleanName) || cleanName.includes(k));
          if (matchKey) {
            resolvedSubCategoryId = categoryMap.get(matchKey)!;
          }
        }

        if (resolvedSubCategoryId) {
          updateDoc.subcategory = resolvedSubCategoryId;
          updateDoc.subCategoryId = resolvedSubCategoryId;
          needsUpdate = true;
          console.log(` -> Mapped string subcategory "${subcategoryVal}" to ObjectId "${resolvedSubCategoryId}"`);
        } else {
          console.log(` -> ⚠️ Could not find subcategory match for string: "${subcategoryVal}"`);
        }
      }

      if (needsUpdate) {
        await productsCollection.updateOne(
          { _id: rawProd._id },
          { $set: updateDoc }
        );
        migrationCount++;
      }
    }

    console.log(`\n🎉 Successfully migrated ${migrationCount} products from legacy string-based categorization.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateOldStringProducts();
