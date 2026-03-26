const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const ProductSchema = new mongoose.Schema({
  productName: String,
  seller: mongoose.Schema.Types.ObjectId
}, { strict: false, collection: 'products' });

const SellerSchema = new mongoose.Schema({
  status: String
}, { strict: false, collection: 'sellers' });

const Product = mongoose.model('Product', ProductSchema);
const Seller = mongoose.model('Seller', SellerSchema);

async function findOrphanedProducts() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    const products = await Product.find({});
    let orphanedCount = 0;

    for (const p of products) {
        if (!p.seller) {
            console.log(`Product "${p.productName}" HAS NO SELLER ID!`);
            orphanedCount++;
            continue;
        }
        const s = await Seller.findById(p.seller);
        if (!s) {
            console.log(`Product "${p.productName}" (ID: ${p._id}) HAS SELLER ID ${p.seller} WHICH IS NOT FOUND!`);
            orphanedCount++;
        }
    }
    
    console.log(`\nTotal orphaned products found: ${orphanedCount}`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

findOrphanedProducts();
