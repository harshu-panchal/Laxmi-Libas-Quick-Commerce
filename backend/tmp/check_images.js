const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

async function run() {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);

    try {
        const db = mongoose.connection.db;
        const products = await db.collection("products").find({}).limit(5).toArray();
        console.log("=== PRODUCT IMAGES ===");
        products.forEach(p => {
            console.log(`Product: ${p.productName || p.name}`);
            console.log(`  imageUrl: "${p.imageUrl}"`);
            console.log(`  mainImage: "${p.mainImage}"`);
            console.log(`  images: ${JSON.stringify(p.images)}`);
        });

        const categories = await db.collection("categories").find({}).toArray();
        console.log("\n=== CATEGORIES ICONS ===");
        categories.forEach(c => {
            console.log(`Category: ${c.name}`);
            console.log(`  icon: "${c.icon}"`);
            console.log(`  image: "${c.image}"`);
        });
    } finally {
        await mongoose.disconnect();
    }
}
run();
