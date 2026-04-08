import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ProductSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    productName: String,
    stock: Number,
    price: Number
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function fixStock() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/laxmart';
    await mongoose.connect(uri);
    
    // JEANS product
    const productId = '69d49c512c8a0a741e130ac3';
    const res = await Product.updateOne({ _id: productId }, { $set: { stock: 10, price: 899 } });
    console.log('Update result:', res);
    
    await mongoose.disconnect();
}

fixStock().catch(console.error);
