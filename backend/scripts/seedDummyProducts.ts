import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../src/models/Category';
import Product from '../src/models/Product';
import Seller from '../src/models/Seller';
import connectDB from '../src/config/db';

dotenv.config();

const DUMMY_PRODUCTS_PER_CATEGORY = 2;

async function seedProducts() {
    try {
        await connectDB();
        console.log('Connected to database. Starting product seeding...');

        // 1. Get or Create System Seller
        const servicesCat = await Category.findOne({ name: 'Services', status: 'Active' });
        if (!servicesCat) {
            console.error('Core categories not found. Please run setupCoreCategories.ts first.');
            process.exit(1);
        }

        let systemSeller = await Seller.findOne({ email: 'admin@laxmart.com' });
        if (!systemSeller) {
            systemSeller = await Seller.create({
                sellerName: 'LaxMart Official',
                storeName: 'LaxMart Central',
                email: 'admin@laxmart.com',
                mobile: '1234567890',
                category: servicesCat._id,
                status: 'Approved',
                address: 'LaxMart HQ, India',
                city: 'Mumbai',
                commission: 0,
                isShopOpen: true,
                balance: 0,
                categories: ['Services'],
                location: {
                    type: 'Point',
                    coordinates: [72.8777, 19.0760] // [longitude, latitude] - Mumbai
                },
                latitude: '19.0760',
                longitude: '72.8777',
                serviceRadiusKm: 10
            });
            console.log('Created system seller: LaxMart Official');
        }

        // 2. Get all active core categories
        const categories = await Category.find({ status: 'Active' });
        console.log(`Found ${categories.length} active categories.`);

        // 3. Delete existing dummy products for this seller (to avoid duplicates on rerun)
        const deleteRes = await Product.deleteMany({ seller: systemSeller._id });
        console.log(`Removed ${deleteRes.deletedCount} old dummy products.`);

        // 4. Create dummy products for each category
        for (const cat of categories) {
            for (let i = 1; i <= DUMMY_PRODUCTS_PER_CATEGORY; i++) {
                const price = Math.floor(Math.random() * 1000) + 100;
                const discount = Math.floor(Math.random() * 40) + 10;
                const mrp = Math.floor(price / (1 - discount / 100));

                await Product.create({
                    productName: `Dummy ${cat.name} ${i}`,
                    smallDescription: `High-quality ${cat.name.toLowerCase()} item for you.`,
                    description: `This is a premium ${cat.name.toLowerCase()} product available at LaxMart.`,
                    category: cat._id,
                    seller: systemSeller._id,
                    price: price,
                    compareAtPrice: mrp,
                    stock: 100,
                    status: 'Active',
                    publish: true,
                    mainImage: `https://placehold.co/400x400?text=${encodeURIComponent(cat.name + ' ' + i)}`,
                    galleryImages: [],
                    rating: 4 + Math.random(),
                    reviewsCount: Math.floor(Math.random() * 50) + 5,
                    pack: '1 Piece',
                    isReturnable: true,
                    maxReturnDays: 7,
                    tags: [cat.name.toLowerCase(), 'dummy', 'laxmart']
                });
            }
            console.log(`Seeded products for category: ${cat.name}`);
        }

        console.log('Product seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Product seeding failed:', error);
        process.exit(1);
    }
}

seedProducts();
