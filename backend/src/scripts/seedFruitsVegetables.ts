import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Category from "../models/Category";
import HeaderCategory from "../models/HeaderCategory";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dhakadsnazzy";

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // 1. Find "Grocery" header category
        let headerCategory = await HeaderCategory.findOne({
            $or: [{ name: "Grocery" }, { slug: "grocery" }],
        });

        if (!headerCategory) {
            console.log('Header category "Grocery" not found, searching for any published header...');
            headerCategory = await HeaderCategory.findOne({ status: "Published" });
        }

        if (!headerCategory) {
            console.log("No header categories found. Please create one first.");
            process.exit(1);
        }

        console.log(`Using header category: ${headerCategory.name}`);

        // 2. Add "Fruits & Vegetables" category
        const categoryName = "Fruits & Vegetables";
        const categorySlug = "fruits-vegetables";

        const existingCategory = await Category.findOne({ name: categoryName });

        if (existingCategory) {
            console.log(`Category "${categoryName}" already exists.`);
        } else {
            await Category.create({
                name: categoryName,
                slug: categorySlug,
                image: "https://placehold.co/300x300/f5f5f5/737373?text=Fruits-Vegetables",
                order: 0,
                status: "Active",
                isBestseller: true,
                hasWarning: false,
                headerCategoryId: headerCategory._id,
            });
            console.log(`Created category: ${categoryName}`);
        }

        console.log("Seeding completed successfully!");
        process.exit(0);
    } catch (error: any) {
        console.error(`Seeding failed: ${error.message}`);
        process.exit(1);
    }
}

seed();
