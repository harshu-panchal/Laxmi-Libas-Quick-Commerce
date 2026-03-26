const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const ProductSchema = new mongoose.Schema({
  seller: mongoose.Schema.Types.ObjectId
}, { strict: false, collection: 'products' });

const Product = mongoose.model('Product', ProductSchema);

async function updateProductSeller() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    const result = await Product.updateMany(
        { productName: /DAV/i },
        { $set: { seller: new mongoose.Types.ObjectId('69bbf010d8c2f117369f3ddd') } }
    );
    
    console.log(`Updated ${result.modifiedCount} products to Clothing General Store.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

updateProductSeller();
