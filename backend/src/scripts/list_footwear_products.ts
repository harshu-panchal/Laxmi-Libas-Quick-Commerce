import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function listFootwearProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const Product = mongoose.connection.collection('products');
        const Category = mongoose.connection.collection('categories');

        const catId = new mongoose.Types.ObjectId('69bbf008d8c2f117369f3cc7');
        
        // Find products directly in Footwear
        const products = await Product.find({ 
            $or: [
                { category: catId },
                { subcategory: catId }
            ]
        }).toArray();

        console.log(`Found ${products.length} products in Footwear category/subcategory:`);
        products.forEach(p => {
            console.log(`- ID: ${p._id}, Name: ${p.name}`);
        });

        // Find subcategories of Footwear
        const childCats = await Category.find({ parentId: catId }).toArray();
        for (const child of childCats) {
            const childProducts = await Product.find({ 
                $or: [
                    { category: child._id },
                    { subcategory: child._id }
                ]
            }).toArray();
            if (childProducts.length > 0) {
                console.log(`\nProducts in child category "${child.name}" (${child._id}):`);
                childProducts.forEach(p => {
                    console.log(`  - ID: ${p._id}, Name: ${p.name}`);
                });
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

listFootwearProducts();
