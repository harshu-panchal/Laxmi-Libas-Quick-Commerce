import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../src/models/Category';
import SubCategory from '../src/models/SubCategory';
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
    { name: 'Rent', slug: 'rent', order: 10 },
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
            // Rename 'Room Rent' to 'Rent' if exists
            if (coreCat.name === 'Rent') {
                const oldCat = await Category.findOne({ name: 'Room Rent' });
                if (oldCat) {
                    oldCat.name = 'Rent';
                    oldCat.slug = 'rent';
                    oldCat.order = coreCat.order;
                    oldCat.status = 'Active';
                    await oldCat.save();
                    console.log("Renamed 'Room Rent' to 'Rent'.");
                }
            }

            const existing = await Category.findOne({ name: coreCat.name });
            let categoryId;

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
                categoryId = existing._id;
                console.log(`Updated core category: ${coreCat.name}`);
            } else {
                const newCat = await Category.create({
                    ...coreCat,
                    status: 'Active',
                });
                categoryId = newCat._id;
                console.log(`Created core category: ${coreCat.name}`);
            }

            // Create subcategories for 'Rent'
            if (coreCat.name === 'Rent' && categoryId) {
                const rentSubCats = ['Room Rent', 'Bike Rent'];
                for (const subName of rentSubCats) {
                    const existingSub = await SubCategory.findOne({ category: categoryId, name: subName });

                    if (!existingSub) {
                        await SubCategory.create({
                            category: categoryId,
                            name: subName,
                            order: 1
                        });
                        console.log(`Created subcategory '${subName}' for 'Rent'.`);
                    }
                }
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
