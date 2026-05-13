const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const db = mongoose.connection.db;
        const products = await db.collection("products").find({
            $or: [
                { category: new mongoose.Types.ObjectId("69f5ebaf162529539725eafe") },
                { categoryId: new mongoose.Types.ObjectId("69f5ebaf162529539725eafe") }
            ]
        }).toArray();

        console.log(`Found ${products.length} products under DAV UNIFORM category:`);
        for (const p of products) {
            const subName = await db.collection("categories").findOne({ _id: p.subcategory || p.subCategoryId });
            console.log(`- ID: ${p._id}, Name: ${p.productName}, Status: ${p.status}, Publish: ${p.publish}, Subcategory ID: ${p.subcategory || p.subCategoryId}, Subcategory Name: ${subName ? subName.name : 'Unknown'}`);
        }
    } finally {
        await mongoose.disconnect();
    }
}
run();
