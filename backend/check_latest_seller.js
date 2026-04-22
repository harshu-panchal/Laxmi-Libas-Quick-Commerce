const mongoose = require('mongoose');

async function checkLatestSeller() {
  try {
    await mongoose.connect('mongodb://localhost:27017/laxmi_libas_quick_commerce');
    console.log('Connected to MongoDB');
    
    // We don't need the full schema, just enough to find the latest
    const Seller = mongoose.model('Seller', new mongoose.Schema({}, { strict: false, collection: 'sellers' }));
    
    const latest = await Seller.findOne().sort({ createdAt: -1 });
    
    if (latest) {
      console.log('Latest Seller found:');
      console.log(JSON.stringify(latest, null, 2));
    } else {
      console.log('No sellers found.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

checkLatestSeller();
