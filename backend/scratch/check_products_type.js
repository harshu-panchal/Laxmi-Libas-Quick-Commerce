require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");
  
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const products = await Product.find().lean();
  console.log("Total Products:", products.length);
  
  const typeCounts = {};
  const sampleByType = {};
  
  products.forEach(p => {
     let typ = p.type || "undefined";
     typeCounts[typ] = (typeCounts[typ] || 0) + 1;
     if (!sampleByType[typ]) sampleByType[typ] = p;
  });
  
  console.log("Product counts by type:", typeCounts);
  
  process.exit(0);
}
check().catch(console.error);
