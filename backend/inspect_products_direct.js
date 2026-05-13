const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("❌ MONGODB_URI not found");
        process.exit(1);
    }

    await mongoose.connect(uri);

    try {
        const db = mongoose.connection.db;
        const productsCollection = db.collection("products");
        const categoriesCollection = db.collection("categories");
        const sellersCollection = db.collection("sellers");

        console.log("=================== PRODUCTS STATS ===================");
        const totalProducts = await productsCollection.countDocuments({});
        console.log("Total Products in Database:", totalProducts);

        const activePublishedProducts = await productsCollection.countDocuments({ status: "Active", publish: true });
        console.log("Active & Published Products in Database:", activePublishedProducts);

        const sampleProducts = await productsCollection.find({}).limit(50).toArray();
        console.log("\n--- Sample 50 Products ---");
        sampleProducts.forEach(p => {
            console.log(`- ID: ${p._id}, Name: ${p.productName || p.name}, Status: ${p.status}, Publish: ${p.publish}, Category: ${p.category || p.categoryId}, Subcategory: ${p.subcategory || p.subCategoryId}, Seller: ${p.seller || p.sellerId}, Type: ${p.type}, isQuickEligible: ${p.isQuickEligible}, Pincodes: ${JSON.stringify(p.availablePincodes)}`);
        });

        console.log("\n=================== CATEGORIES STATS ===================");
        const totalCategories = await categoriesCollection.countDocuments({});
        console.log("Total Categories in Database:", totalCategories);

        const categories = await categoriesCollection.find({}).toArray();
        console.log("\n--- Categories Hierarchy ---");
        categories.forEach(c => {
            console.log(`- ID: ${c._id}, Name: ${c.name}, Slug: ${c.slug}, ParentId: ${c.parentId}, Status: ${c.status}`);
        });

        console.log("\n=================== SELLERS STATS ===================");
        const totalSellers = await sellersCollection.countDocuments({});
        console.log("Total Sellers in Database:", totalSellers);

        const sellers = await sellersCollection.find({}).toArray();
        sellers.forEach(s => {
            console.log(`- ID: ${s._id}, StoreName: ${s.storeName}, City: ${s.city}, Status: ${s.status}, BusinessTypes: ${JSON.stringify(s.businessTypes)}`);
        });

    } catch (err) {
        console.error("❌ Error querying database:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
