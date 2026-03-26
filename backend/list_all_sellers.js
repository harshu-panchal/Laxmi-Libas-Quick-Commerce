const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function listAllSellers() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    const sellers = await mongoose.connection.db.collection('sellers').find({}).toArray();
    console.log(`Total sellers in collection: ${sellers.length}`);
    for (const s of sellers) {
        console.log(`- ID: ${s._id}, Name: ${s.storeName || s.sellerName}, Status: ${s.status}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

listAllSellers();
