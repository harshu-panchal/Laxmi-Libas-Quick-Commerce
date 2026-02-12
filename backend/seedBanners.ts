
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Banner from './src/models/Banner';

dotenv.config();

const banners = [
    {
        imageUrl: 'https://img.freepik.com/free-vector/grocery-store-sale-banner-template_23-2150032212.jpg',
        title: 'Fresh Fruits & Vegetables',
        link: '/category/grocery',
        order: 1,
        isActive: true,
        pageLocation: 'Home Page'
    },
    {
        imageUrl: 'https://img.freepik.com/free-vector/mega-sale-banner-template_23-2148967913.jpg',
        title: 'Mega Sale - Up to 50% Off',
        link: '/category/fashion',
        order: 2,
        isActive: true,
        pageLocation: 'Home Page'
    },
    {
        imageUrl: 'https://img.freepik.com/free-vector/flat-design-food-sale-background_23-2149156645.jpg',
        title: 'Daily Essentials',
        link: '/category/grocery',
        order: 3,
        isActive: true,
        pageLocation: 'Home Page'
    }
];

async function seedBanners() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        await Banner.deleteMany({});
        await Banner.insertMany(banners);

        console.log('Banners seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding banners:', error);
        process.exit(1);
    }
}

seedBanners();
