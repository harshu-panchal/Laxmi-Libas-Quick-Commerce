import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../src/models/Category';
import connectDB from '../src/config/db';

dotenv.config();

const CORE_CATEGORIES = [
    { name: 'Fast Fashion', slug: 'fast-fashion', order: 1 },
    { name: 'Footwear', slug: 'footwear', order: 2 },
    { name: 'Grocery', slug: 'grocery', order: 3 },
    { name: 'Food', slug: 'food', order: 4 },
    { name: 'Beauty', slug: 'beauty', order: 5 },
    { name: 'Electronics', slug: 'electronics', order: 6 },
    { name: 'Toys', slug: 'toys', order: 7 },
    { name: 'Home & Furniture', slug: 'home-furniture', order: 8 },
    { name: 'Eyeglasses', slug: 'eyeglasses', order: 9 },
    { name: 'Room Rent', slug: 'room-rent', order: 10 },
    { name: 'Automotive Parts', slug: 'automotive-parts', order: 11 },
    { name: 'Services', slug: 'services', order: 12 },
];

async function setupCategories() {
    try {
        await connectDB();
        console.log('Connected to database. Starting category setup...');

        // 1. Deactivate all existing categories
        const deactivateRes = await Category.updateMany(
            { name: { $nin: CORE_CATEGORIES.map(c => c.name) } },
            { $set: { status: 'Inactive' } }
        );
        console.log(`Deactivated ${deactivateRes.modifiedCount} old categories.`);

        // 2. Create or Update core categories
        for (const coreCat of CORE_CATEGORIES) {
            const existing = await Category.findOne({ name: coreCat.name });

            if (existing) {
                await Category.updateOne(
                    { _id: existing._id },
                    {
                        $set: {
                            slug: coreCat.slug,
                            order: coreCat.order,
                            status: 'Active',
                            parentId: null // Ensure they are top-level
                        }
                    }
                );
                console.log(`Updated core category: ${coreCat.name}`);
            } else {
                await Category.create({
                    ...coreCat,
                    status: 'Active',
                });
                console.log(`Created core category: ${coreCat.name}`);
            }
        }

        console.log('Category setup completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Category setup failed:', error);
        process.exit(1);
    }
}

setupCategories();
