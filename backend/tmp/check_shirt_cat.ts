import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CategorySchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String
}, { strict: false });

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

async function checkCategoryName() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/laxmart';
    await mongoose.connect(uri);
    
    const shirtCat = await Category.findById('69bbf007d8c2f117369f3ca7');
    if (shirtCat) {
        console.log('Shirt category name:', shirtCat.name);
    } else {
        console.log('Shirt category NOT found.');
    }
    
    await mongoose.disconnect();
}

checkCategoryName().catch(console.error);
