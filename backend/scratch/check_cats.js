require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  console.log("--- Header Categories ---");
  const headers = await db.collection('headercategories').find({}).toArray();
  console.log(headers.map(h => ({ _id: h._id, name: h.name, slug: h.slug })));

  const fashion = headers.find(h => h.slug === 'fastion' || h.slug === 'fashion');
  if (!fashion) {
    console.log("Fashion header not found");
    process.exit(0);
  }

  console.log("\n--- Categories under Fashion ---");
  const cats = await db.collection('categories').find({ headerCategoryId: fashion._id }).toArray();
  console.log(cats.map(c => ({ _id: c._id, name: c.name, slug: c.slug, parentId: c.parentId })));

  console.log("\n--- SubCategories ---");
  const subs = await db.collection('subcategories').find({}).toArray();
  console.log(subs.map(s => ({ _id: s._id, name: s.name, category: s.category })));

  console.log("\n--- HomeSections ---");
  const sections = await db.collection('homesections').find({}).toArray();
  console.log(sections.map(s => ({ _id: s._id, title: s.title, displayType: s.displayType, categories: s.categories, subCategories: s.subCategories, targetHeaderCategory: s.targetHeaderCategory })));

  process.exit(0);
}

check();
