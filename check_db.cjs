const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function checkCategories() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("MONGODB_URI not found");
      return;
    }
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const CategorySchema = new mongoose.Schema({
      name: String,
      status: String,
      parentId: mongoose.Schema.Types.ObjectId
    }, { collection: 'categories' });

    const SubCategorySchema = new mongoose.Schema({
      name: String,
      category: mongoose.Schema.Types.ObjectId
    }, { collection: 'subcategories' });

    const Category = mongoose.model('Category', CategorySchema);
    const SubCategory = mongoose.model('SubCategory', SubCategorySchema);

    const categories = await Category.find({ name: /Clothing/i });
    console.log("Categories named 'Clothing':");
    for (const cat of categories) {
      console.log(`- ${cat.name} (${cat._id}) Status: ${cat.status} ParentId: ${cat.parentId}`);
      
      const categoryChildren = await Category.find({ parentId: cat._id });
      console.log(`  L1 Categories (with parentId): ${categoryChildren.length}`);
      categoryChildren.forEach(c => console.log(`    - ${c.name} (${c._id}) Status: ${c.status}`));
      
      const subCategories = await SubCategory.find({ category: cat._id });
      console.log(`  Subcategories (old model): ${subCategories.length}`);
      subCategories.forEach(s => console.log(`    - ${s.name} (${s._id})`));
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkCategories();
