import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ProductSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    productName: String,
    category: mongoose.Schema.Types.ObjectId
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function checkProductShirt() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/laxmart';
    await mongoose.connect(uri);
    
    const shirt = await Product.findOne({ productName: 'Shirt' });
    if (shirt) {
        console.log('Shirt category ID:', shirt.category);
    } else {
        console.log('Shirt NOT found.');
    }
    
    await mongoose.disconnect();
}

checkProductShirt().catch(console.error);
