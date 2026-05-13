import mongoose from "mongoose";
import dotenv from "dotenv";
import Seller from "../src/models/Seller";
import Product from "../src/models/Product";
import Category from "../src/models/Category";
import SubCategory from "../src/models/SubCategory";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/NewDatabaseName";

async function main() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const seller = await Seller.findOne({ mobile: "7004308732" });
  if (!seller) {
    console.log("❌ Seller 7004308732 not found!");
    await mongoose.disconnect();
    return;
  }

  console.log("=== SELLER PROFILE ===");
  console.log("ID:", seller._id);
  console.log("Name:", seller.sellerName);
  console.log("Store Name:", seller.storeName);
  console.log("Mobile:", seller.mobile);
  console.log("Status:", seller.status);
  console.log("City:", seller.city);
  console.log("Location:", JSON.stringify(seller.location));
  console.log("Structured Location:", JSON.stringify(seller.structuredLocation));

  const productCount = await Product.countDocuments({ seller: seller._id });
  console.log("\n=== PRODUCT SUMMARY ===");
  console.log("Total Products:", productCount);

  const activeCount = await Product.countDocuments({ seller: seller._id, status: "Active" });
  const inactiveCount = await Product.countDocuments({ seller: seller._id, status: "Inactive" });
  const pendingCount = await Product.countDocuments({ seller: seller._id, status: "Pending" });
  const approvedCount = await Product.countDocuments({ seller: seller._id, adminApproved: true });
  const publishTrueCount = await Product.countDocuments({ seller: seller._id, publish: true });

  console.log("Active Products:", activeCount);
  console.log("Inactive Products:", inactiveCount);
  console.log("Pending Products:", pendingCount);
  console.log("AdminApproved Products:", approvedCount);
  console.log("Publish=true Products:", publishTrueCount);

  // Let's check a sample product details
  const sampleProduct = await Product.findOne({ seller: seller._id });
  if (sampleProduct) {
    console.log("\n=== SAMPLE PRODUCT ===");
    console.log("Name:", sampleProduct.productName);
    console.log("Category Field:", sampleProduct.category);
    console.log("CategoryId Field:", sampleProduct.categoryId);
    console.log("Subcategory Field:", sampleProduct.subcategory);
    console.log("SubCategoryId Field:", sampleProduct.subCategoryId);
    console.log("Delivery Type Field:", sampleProduct.deliveryType);
    console.log("Type Field:", sampleProduct.type);
    console.log("IsQuickEligible Field:", sampleProduct.isQuickEligible);
    console.log("City:", sampleProduct.city);
    console.log("Status:", sampleProduct.status);
    console.log("Publish:", sampleProduct.publish);
    console.log("Full JSON Keys:", Object.keys(sampleProduct.toObject()));
    
    // Check if Category and SubCategory documents actually exist for this product
    if (sampleProduct.category) {
      const catDoc = await Category.findById(sampleProduct.category);
      console.log(`Category doc exists: ${!!catDoc}`, catDoc ? catDoc.name : "N/A");
    }
    if (sampleProduct.subcategory) {
      const subcatDoc = await SubCategory.findById(sampleProduct.subcategory);
      console.log(`SubCategory doc exists: ${!!subcatDoc}`, subcatDoc ? subcatDoc.name : "N/A");
    }
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
