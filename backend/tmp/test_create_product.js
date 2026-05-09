const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env
dotenv.config({ path: path.join(__dirname, "../.env") });

// Import models
const Product = require("../src/models/Product").default;
const Seller = require("../src/models/Seller").default;

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("❌ MONGODB_URI not found");
        process.exit(1);
    }

    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("✅ Connected!");

    try {
        // Fetch active test seller profile
        const sellerId = "69faf49b09470e0af914e30e"; 
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            console.error("❌ Test seller profile not found!");
            return;
        }
        console.log(`🏪 Loaded Seller: ${seller.storeName} (${seller.city})`);

        // Get first category in DB to avoid validation errors
        const Category = require("../src/models/Category").default;
        const firstCategory = await Category.findOne({});
        const categoryId = firstCategory ? firstCategory._id : new mongoose.Types.ObjectId();
        console.log(`📁 Using Category ID: ${categoryId} (${firstCategory ? firstCategory.name : 'Fallback Mock'})`);

        // Mock payload representing what the seller panel sends
        const productData = {
            productName: "Diagnostic Test Product",
            price: 150,
            discPrice: 120,
            stock: 25,
            deliveryType: "ecommerce",
            availablePincodes: "*", // Using our new wildcard
            isShopByStoreOnly: false,
            tags: "test, diagnostic",
            manufacturer: "LaxMart HQ",
            madeIn: "India",
            totalAllowedQuantity: 10,
            publish: "Yes"
        };

        // Replicate exact controller mapping logic from productController.ts
        const newProductData = {
            ...productData,
            seller: sellerId,
            category: categoryId,
            mainImage: "https://via.placeholder.com/150",
            galleryImages: [],
            price: productData.price,
            discPrice: productData.discPrice || 0,
            stock: parseInt(productData.stock) || 0,
            type: productData.deliveryType || "quick",
            availablePincodes: productData.availablePincodes 
                ? productData.availablePincodes.split(",").map(p => p.trim()).filter(Boolean) 
                : [],
            publish: true,
            status: "Active",
            requiresApproval: false
        };

        // Replicate location syncing from controller
        if (!newProductData.city || !newProductData.pincode) {
            newProductData.city = seller.city;
            newProductData.pincode = (seller.structuredLocation && seller.structuredLocation.pincode) || seller.pincode;
            
            if (!newProductData.latitude && seller.latitude) {
                newProductData.latitude = parseFloat(seller.latitude);
            }
            if (!newProductData.longitude && seller.longitude) {
                newProductData.longitude = parseFloat(seller.longitude);
            }
        }

        console.log("\n📦 Prepared Product Payload:", JSON.stringify(newProductData, null, 2));

        // 1. Run local schema validations
        console.log("\n🔍 Running Mongoose Local Schema Validation...");
        const prodDoc = new Product(newProductData);
        const valErr = prodDoc.validateSync();
        if (valErr) {
            console.error("❌ Local Validation Failed!");
            console.error(valErr.message);
            console.dir(valErr.errors);
            return;
        }
        console.log("✅ Local schema validation passed!");

        // 2. Run Database Insertion
        console.log("\n💾 Executing database create Product query...");
        const product = await Product.create(newProductData);
        console.log(`✅ Success! Product created with ID: ${product._id}`);

        // Clean up test document
        await Product.deleteOne({ _id: product._id });
        console.log("🧹 Cleaned up diagnostic product from DB.");

    } catch (err) {
        console.error("\n💥 DATABASE TRANSACTION FAILED with the following error:");
        if (err.name === 'ValidationError') {
            console.error(`- Mongoose ValidationError: ${err.message}`);
            console.dir(err.errors);
        } else if (err.code === 11000) {
            console.error(`- MongoDB Duplicate Key Index Error (11000):`);
            console.dir(err.keyValue);
        } else {
            console.error(err);
        }
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB.");
    }
}

run();
