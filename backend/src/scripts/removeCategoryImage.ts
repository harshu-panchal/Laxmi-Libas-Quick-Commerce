import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Category from "../models/Category";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dhakadsnazzy";

async function removeImage() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const categoryName = "Fruits & Vegetables";

        const result = await Category.updateOne(
            { name: categoryName },
            { $unset: { image: "" } }
        );

        if (result.matchedCount > 0) {
            console.log(`Successfully removed image for category: ${categoryName}`);
        } else {
            console.log(`Category "${categoryName}" not found.`);
        }

        process.exit(0);
    } catch (error: any) {
        console.error(`Operation failed: ${error.message}`);
        process.exit(1);
    }
}

removeImage();
