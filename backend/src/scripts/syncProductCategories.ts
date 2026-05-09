import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product";
import Category from "../models/Category";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Database connected successfully!");

    const products = await Product.find().lean();
    console.log(`Total products to check: ${products.length}`);

    let updatedCount = 0;
    for (const prod of products) {
      const categoryId = prod.category;
      if (!categoryId) {
        console.log(`Product "${prod.productName || (prod as any).name}" is missing a category!`);
        continue;
      }

      const categoryDoc = await Category.findById(categoryId).lean();
      if (!categoryDoc) {
        console.log(`Category "${categoryId}" not found for product "${prod.productName || (prod as any).name}"`);
        continue;
      }

      const headerCategoryId = categoryDoc.headerCategoryId;
      if (!headerCategoryId) {
        console.log(`Category "${categoryDoc.name}" does not have headerCategoryId!`);
        continue;
      }

      // Check if product's headerCategoryId is missing or different
      if (!prod.headerCategoryId || prod.headerCategoryId.toString() !== headerCategoryId.toString()) {
        await Product.updateOne(
          { _id: prod._id },
          { $set: { headerCategoryId: headerCategoryId } }
        );
        updatedCount++;
        console.log(`Synced product "${prod.productName || (prod as any).name}" with headerCategoryId: "${headerCategoryId}" from Category "${categoryDoc.name}"`);
      }
    }

    console.log(`Successfully synchronized ${updatedCount} products with correct headerCategoryId!`);

  } catch (err) {
    console.error("Execution failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
