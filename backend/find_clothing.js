const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const SellerSchema = new mongoose.Schema({
  status: String,
  storeName: String
}, { strict: false, collection: 'sellers' });

const Seller = mongoose.model('Seller', SellerSchema);

async function findClothingSeller() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    const s = await Seller.findOne({ storeName: /Clothing/i });
    if (s) {
        console.log(`Clothing Seller Found: ${s.storeName}, ID: ${s._id}, Status: ${s.status}`);
    } else {
        console.log('No Clothing seller found.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

findClothingSeller();
