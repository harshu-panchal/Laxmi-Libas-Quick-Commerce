import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CategorySchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    slug: String
}, { strict: false });

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

async function checkCategory() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/laxmart';
    await mongoose.connect(uri);
    
    const categoryId = '69bd2161dc57221d8205aead';
    const category = await Category.findById(categoryId);
    if (category) {
        console.log('Category found:', category.name);
    } else {
        console.log('Category NOT found.');
    }
    
    await mongoose.disconnect();
}

checkCategory().catch(console.error);
