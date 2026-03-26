const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const ProductSchema = new mongoose.Schema({
  productName: String,
  seller: mongoose.Schema.Types.ObjectId,
  status: String
}, { strict: false, collection: 'products' });

const Product = mongoose.model('Product', ProductSchema);

async function checkProduct() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    const products = await Product.find({ productName: /DAV/i });
    console.log(`Found ${products.length} products with "DAV" in name.`);

    for (const p of products) {
        console.log(`- Product: ${p.productName}, ID: ${p._id}, SellerID: ${p.seller}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkProduct();
