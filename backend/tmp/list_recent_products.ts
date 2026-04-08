import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ProductSchema = new mongoose.Schema({
    productName: String,
    stock: Number,
    price: Number,
    category: mongoose.Schema.Types.ObjectId
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function listProducts() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/laxmart';
    await mongoose.connect(uri);
    
    const products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
    console.log('Recent 5 products:');
    products.forEach(p => {
        console.log(`- ${p.productName} (ID: ${p._id}, Stock: ${p.stock}, Price: ${p.price})`);
    });
    
    await mongoose.disconnect();
}

listProducts().catch(console.error);
