import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function listCategories() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/laxmart';
    await mongoose.connect(uri);
    
    const db = mongoose.connection.db;
    if (!db) {
        console.error('No database connection');
        return;
    }
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    const Category = db.collection('categories');
    const categories = await Category.find({}).toArray();
    console.log('Total categories:', categories.length);
    categories.forEach(cat => {
        console.log(`- ${cat.name || cat.subcategoryName} (${cat._id})`);
    });
    
    await mongoose.disconnect();
}

listCategories().catch(console.error);
