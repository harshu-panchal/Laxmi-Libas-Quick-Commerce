import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Validate configuration
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.warn("⚠️  Cloudinary credentials not found in environment variables");
}

export default cloudinary;

// Folder structure constants
export const CLOUDINARY_FOLDERS = {
  PRODUCTS: "laxmart/products",
  PRODUCT_GALLERY: "laxmart/products/gallery",
  PRODUCT_VIDEOS: "laxmart/products/videos",
  CATEGORIES: "laxmart/categories",
  SUBCATEGORIES: "laxmart/subcategories",
  COUPONS: "laxmart/coupons",
  SELLERS: "laxmart/sellers",
  SELLER_PROFILE: "laxmart/sellers/profile",
  SELLER_DOCUMENTS: "laxmart/sellers/documents",
  DELIVERY: "laxmart/delivery",
  DELIVERY_DOCUMENTS: "laxmart/delivery/documents",
  STORES: "laxmart/stores",
  USERS: "laxmart/users",
} as const;
