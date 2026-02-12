import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Seller from '../src/models/Seller';
import Category from '../src/models/Category';
import connectDB from '../src/config/db';

dotenv.config();

async function migrate() {
    try {
        await connectDB();
        console.log('Starting migration...');

        const sellers = await Seller.find({});
        console.log(`Found ${sellers.length} sellers.`);

        for (const seller of sellers) {
            const oldCategory = seller.category;

            // Check if it's already an ObjectId (though currently schema says string)
            if (mongoose.Types.ObjectId.isValid(oldCategory)) {
                console.log(`Seller ${seller.storeName} already has an ObjectId category. Skipping.`);
                continue;
            }

            console.log(`Migrating seller ${seller.storeName}: "${oldCategory}" -> ObjectId`);

            // Find or create category
            let categoryDoc = await Category.findOne({ name: new RegExp(`^${oldCategory}$`, 'i') });

            if (!categoryDoc) {
                console.log(`Category "${oldCategory}" not found. Creating it...`);
                categoryDoc = await Category.create({
                    name: oldCategory,
                    status: 'Active',
                    order: 0
                });
            }

            // Update seller
            // We use updateOne with bypass validation if needed, 
            // but here we just update the field.
            await Seller.updateOne(
                { _id: seller._id },
                { $set: { category: categoryDoc._id.toString() } }
            );

            console.log(`Successfully migrated ${seller.storeName} to category ${categoryDoc.name} (${categoryDoc._id})`);
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
