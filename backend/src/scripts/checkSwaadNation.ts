import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product";
import Seller from "../models/Seller";
import Category from "../models/Category";
import SubCategory from "../models/SubCategory";
import HeaderCategory from "../models/HeaderCategory";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Database connected successfully!");

    // 1. Get header categories
    console.log("\n=== HEADER CATEGORIES ===");
    const headerCats = await HeaderCategory.find().lean();
    console.log(headerCats.map((h: any) => ({
      _id: h._id,
      name: h.name,
      slug: h.slug,
      status: h.status
    })));

    // 2. Get categories under "Restaurant"
    console.log("\n=== CATEGORIES ===");
    const cats = await Category.find().lean();
    console.log(cats.map((c: any) => ({
      _id: c._id,
      name: c.name,
      slug: c.slug,
      parentId: c.parentId,
      headerCategoryId: c.headerCategoryId,
      status: c.status
    })));

    // 3. Get subcategories matching "swaad"
    console.log("\n=== SUBCATEGORIES ===");
    const subCats = await SubCategory.find({ name: { $regex: /swaad|nation/i } }).lean();
    console.log(subCats);

    const allSubCats = await SubCategory.find().limit(20).lean();
    console.log("SAMPLE SUBCATEGORIES:", allSubCats.map(sc => ({ _id: sc._id, name: sc.name, category: sc.category })));

    // 4. Get products matching "swaad", "nation", or related to category "Swadh Nation"
    console.log("\n=== PRODUCTS ===");
    const products = await Product.find({
      $or: [
        { productName: { $regex: /swaad|nation|veg/i } },
        { category: new mongoose.Types.ObjectId("69fb722511fd5e05b6145f41") }, // Swadh Nation
        { categoryId: new mongoose.Types.ObjectId("69fb722511fd5e05b6145f41") },
        { subcategory: { $in: [
          new mongoose.Types.ObjectId("69fb72c711fd5e05b614609f"), // Veg
          new mongoose.Types.ObjectId("69fb733111fd5e05b614617c")  // Non Veg
        ] } }
      ]
    });

    console.log(`Found ${products.length} products to update:`);
    for (const p of products) {
      // Set to Active and ensure stock is positive
      p.status = "Active";
      p.stock = p.stock || 100;
      await p.save();
      
      console.log({
        _id: p._id,
        productName: p.productName,
        type: p.type,
        status: p.status,
        stock: p.stock,
        publish: p.publish,
        category: p.category,
        categoryId: p.categoryId,
        subcategory: p.subcategory,
        subCategoryId: p.subCategoryId,
        headerCategory: p.headerCategory,
        headerCategoryId: p.headerCategoryId,
        seller: p.seller,
        sellerId: p.sellerId
      });

      // Fetch seller info
      if (p.seller) {
        const sellerDoc = await Seller.findById(p.seller);
        if (sellerDoc) {
          let updated = false;
          if (sellerDoc.storeName === "Laxmi Libas Test Store" && (!sellerDoc.city || sellerDoc.city !== "Noamundi")) {
            sellerDoc.city = "Noamundi";
            sellerDoc.latitude = "22.1573611";
            sellerDoc.longitude = "85.5049594";
            sellerDoc.location = {
              type: "Point",
              coordinates: [85.5049594, 22.1573611]
            };
            await sellerDoc.save();
            updated = true;
            console.log("✓ Updated Laxmi Libas Test Store location to Noamundi!");
          }
          console.log("SELLER DOC:", {
            _id: sellerDoc._id,
            storeName: sellerDoc.storeName,
            city: sellerDoc.city,
            status: sellerDoc.status,
            isActive: sellerDoc.isActive,
            location: sellerDoc.location,
            wasUpdated: updated
          });
        } else {
          console.log("SELLER NOT FOUND FOR PRODUCT");
        }
      }
    }

  } catch (err) {
    console.error("Execution failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
