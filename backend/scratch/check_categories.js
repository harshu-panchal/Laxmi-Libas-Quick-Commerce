require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");
  
  // 1. Check Header Categories
  const HeaderCategory = mongoose.model('HeaderCategory', new mongoose.Schema({}, { strict: false }));
  const headers = await HeaderCategory.find().lean();
  console.log("HeaderCategories:");
  headers.forEach(h => console.log(` - ${h.name} (${h._id}) slug:${h.slug} status:${h.status}`));
  
  // 2. Check Categories
  const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
  const cats = await Category.find().lean();
  console.log("\nCategories:");
  cats.forEach(c => {
    let parentStr = '';
    if (c.parentId) parentStr += ` parentId:${c.parentId}`;
    if (c.headerCategoryId) parentStr += ` headerCategoryId:${c.headerCategoryId}`;
    console.log(` - ${c.name} (${c._id}) slug:${c.slug} status:${c.status}${parentStr}`);
  });

  // 3. Check SubCategories
  const SubCategory = mongoose.model('SubCategory', new mongoose.Schema({}, { strict: false }));
  const subs = await SubCategory.find().lean();
  console.log("\nSubCategories:");
  subs.forEach(s => console.log(` - ${s.name} (${s._id}) category:${s.category}`));
  
  process.exit(0);
}
check().catch(console.error);
