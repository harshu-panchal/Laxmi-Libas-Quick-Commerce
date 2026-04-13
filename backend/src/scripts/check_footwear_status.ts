import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function checkFootwear() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        const Category = mongoose.connection.collection('categories');
        const SubCategory = mongoose.connection.collection('subcategories');
        const Product = mongoose.connection.collection('products');

        const cat = await Category.findOne({ name: 'Footwear' });
        if (!cat) {
            console.log('Category Footwear not found');
            await mongoose.disconnect();
            return;
        }

        console.log(`\n--- Parent Category ---`);
        console.log(`ID: ${cat._id}`);
        console.log(`Name: ${cat.name}`);

        const childCategories = await Category.find({ parentId: cat._id }).toArray();
        const legacySubcategories = await SubCategory.find({ category: cat._id }).toArray();

        console.log(`\n--- Child Categories (New System) ---`);
        for (const child of childCategories) {
            const pCount = await Product.countDocuments({ 
                $or: [{ category: child._id }, { subcategory: child._id }] 
            });
            console.log(`- ${child.name} (${child._id}): ${pCount} products`);
        }

        console.log(`\n--- Legacy Subcategories ---`);
        for (const sub of legacySubcategories) {
            const pCount = await Product.countDocuments({ subcategory: sub._id });
            console.log(`- ${sub.name} (${sub._id}): ${pCount} products`);
        }

        const parentProductCount = await Product.countDocuments({ category: cat._id });
        console.log(`\nParent Category Product Count: ${parentProductCount}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkFootwear();
