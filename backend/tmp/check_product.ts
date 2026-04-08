import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ProductSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    productName: String,
    stock: { type: Number, default: 0 },
    price: Number,
    seller: mongoose.Schema.Types.ObjectId
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function checkProduct() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/laxmart';
    console.log('Connecting to', uri);
    await mongoose.connect(uri);
    
    const productId = '69d49c512c8a0a741e130ac3';
    console.log('Checking product:', productId);
    
    const product = await Product.findById(productId);
    if (product) {
        console.log('Product found:');
        console.log(JSON.stringify(product, null, 2));
    } else {
        console.log('Product NOT found.');
    }
    
    await mongoose.disconnect();
}

checkProduct().catch(console.error);
