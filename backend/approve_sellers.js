const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const SellerSchema = new mongoose.Schema({
  status: String,
  approvedAt: Date
}, { strict: false });

const Seller = mongoose.model('Seller', SellerSchema);

async function approveAllSellers() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('MONGODB_URI not found in .env file');
        process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    const sellers = await Seller.find({});
    console.log(`Total sellers in database: ${sellers.length}`);
    for (const s of sellers) {
        console.log(`- Seller: ${s.storeName || s.sellerName}, ID: ${s._id}, Status: ${s.status}`);
    }

    const result = await Seller.updateMany(
      { status: { $ne: 'Approved' } },
      { $set: { status: 'Approved', approvedAt: new Date() } }
    );
    
    console.log(`Updated ${result.modifiedCount} sellers to Approved status.`);
    process.exit(0);
  } catch (err) {
    console.error('Error updating sellers:', err);
    process.exit(1);
  }
}

approveAllSellers();
