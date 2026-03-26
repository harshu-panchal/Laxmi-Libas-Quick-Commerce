const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const SellerSchema = new mongoose.Schema({
  sellerName: String,
  mobile: String,
  email: String
}, { strict: false, collection: 'sellers' });

const Seller = mongoose.model('Seller', SellerSchema);

async function findLatestSellers() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    const s = await Seller.find({}).sort({ createdAt: -1 }).limit(5);
    console.log(`Latest 5 sellers:`);

    for (const d of s) {
        console.log(`- Seller: ${d.sellerName}, ID: ${d._id}, Status: ${d.status}, Created: ${d.createdAt}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

findLatestSellers();
