const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const SellerSchema = new mongoose.Schema({
  status: String
}, { strict: false, collection: 'sellers' });

const Seller = mongoose.model('Seller', SellerSchema);

async function checkSpecificSeller() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    const sellerId = '69bd2e16ed751652e89c103c';
    const seller = await Seller.findById(sellerId);
    
    if (seller) {
        console.log(`Seller found: ${seller.storeName || seller.sellerName}, Status: ${seller.status}`);
    } else {
        console.log(`Seller with ID ${sellerId} NOT FOUND in database ${mongoose.connection.name}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkSpecificSeller();
