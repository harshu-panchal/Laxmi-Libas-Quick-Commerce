require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);

  const Seller = mongoose.model('Seller', new mongoose.Schema({}, { strict: false }));
  const sellers = await Seller.find().lean();
  console.log("Total Sellers:", sellers.length);
  sellers.forEach(s => {
    console.log(` - ${s.storeName} (${s._id}) | status: ${s.status} | city: ${s.city}`);
  });
  process.exit(0);
}
check().catch(console.error);
