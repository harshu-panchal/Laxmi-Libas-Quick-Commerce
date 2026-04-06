import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

import { v2 as cloudinary } from "cloudinary";

import Product from "../models/Product";


dotenv.config({ path: path.join(__dirname, "../../.env") });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(localPath: string) {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: "laxmi-libaas/products",
      resource_type: "image",
    });
    return result.secure_url;
  } catch (error: any) {
    console.error(`Cloudinary upload failed for ${localPath}:`, error.message);
    return null;
  }
}

async function addProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");

    const SELLER_ID = "69bbf010d8c2f117369f3ddd";
    const CATEGORY_ID = "69bbf007d8c2f117369f3ca7"; // Clothing
    const SUBCATEGORY_ID = "69bbf007d8c2f117369f3cae"; // Mens Wear
    const JEANS_ID = "69c4c144efa42afe2edc7e7f";
    const SHIRT_ID = "69c4c07defa42afe2edc7dc3";

    const products = [
      {
        productName: "Men's Slim Fit Blue Jeans",
        smallDescription: "Premium stretchable blue slim fit jeans for men.",
        description: "Experience comfort and style with these premium blue slim fit jeans. Made from high-quality stretchable denim, they provide a perfect fit and durability.",
        category: CATEGORY_ID,
        subcategory: SUBCATEGORY_ID,
        subSubCategory: JEANS_ID,
        price: 1299,
        compareAtPrice: 1999,
        stock: 50,
        imagePath: "C:\\Users\\hp\\.gemini\\antigravity\\brain\\9ab29a05-3399-42b9-b0b0-738834d7f82e\\mens_jeans_blue_1774522037260.png",
        tags: ["Mens", "Jeans", "Denim", "Clothing"]
      },
      {
        productName: "Men's Casual Cotton Shirt",
        smallDescription: "Stylish light blue casual cotton shirt for men.",
        description: "Perfect for everyday wear, this light blue casual shirt is made from 100% breathable cotton. Stay cool and comfortable throughout the day.",
        category: CATEGORY_ID,
        subcategory: SUBCATEGORY_ID,
        subSubCategory: SHIRT_ID,
        price: 899,
        compareAtPrice: 1499,
        stock: 35,
        imagePath: "C:\\Users\\hp\\.gemini\\antigravity\\brain\\9ab29a05-3399-42b9-b0b0-738834d7f82e\\mens_cotton_shirt_casual_1774522062211.png",
        tags: ["Mens", "Shirt", "Cotton", "Casual"]
      },
      {
        productName: "Men's Formal White Shirt",
        smallDescription: "Premium white formal shirt for a professional look.",
        description: "Achieve a sharp and professional look with this premium white formal shirt. Featuring a crisp collar and comfortable fabric, it's ideal for office wear and special occasions.",
        category: CATEGORY_ID,
        subcategory: SUBCATEGORY_ID,
        subSubCategory: SHIRT_ID,
        price: 1099,
        compareAtPrice: 1799,
        stock: 25,
        imagePath: "C:\\Users\\hp\\.gemini\\antigravity\\brain\\9ab29a05-3399-42b9-b0b0-738834d7f82e\\mens_formal_shirt_white_1774522080867.png",
        tags: ["Mens", "Formal", "Shirt", "White"]
      }
    ];

    for (const p of products) {
      console.log(`Uploading image for ${p.productName}...`);
      const imageUrl = await uploadToCloudinary(p.imagePath);
      if (!imageUrl) {
        console.error(`Skipping ${p.productName} due to image upload failure.`);
        continue;
      }

      await Product.create({
        productName: p.productName,
        smallDescription: p.smallDescription,
        description: p.description,
        category: p.category,
        subcategory: p.subcategory,
        subSubCategory: p.subSubCategory,
        seller: SELLER_ID,
        mainImage: imageUrl,
        galleryImages: [imageUrl],
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stock: p.stock,
        publish: true,
        status: "Active",
        tags: p.tags,
        sku: `MEN-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`,
        discount: Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
      });
      console.log(`Successfully added: ${p.productName}`);
    }

    console.log("All products added successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

addProducts();
