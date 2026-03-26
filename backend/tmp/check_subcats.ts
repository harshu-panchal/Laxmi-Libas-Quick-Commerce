import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const CategorySchema = new mongoose.Schema({
  name: String,
  parentId: mongoose.Schema.Types.ObjectId,
  status: String,
});

const SubCategorySchema = new mongoose.Schema({
  name: String,
  category: mongoose.Schema.Types.ObjectId,
});

const Category = mongoose.model('Category', CategorySchema);
const SubCategory = mongoose.model('SubCategory', SubCategorySchema);

async function checkCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected to MongoDB');

    const clothingCategories = await Category.find({ name: /Clothing/i });
    console.log('Clothing Categories found:', JSON.stringify(clothingCategories, null, 2));

    for (const cat of clothingCategories) {
      const subcatsFromCategoryModel = await Category.find({ parentId: cat._id });
      console.log(`Subcategories for category ID ${cat._id} (name: ${cat.name}) from Category model:`, 
        JSON.stringify(subcatsFromCategoryModel, null, 2));

      const subcatsFromSubCategoryModel = await SubCategory.find({ category: cat._id });
      console.log(`Subcategories for category ID ${cat._id} (name: ${cat.name}) from SubCategory model:`, 
        JSON.stringify(subcatsFromSubCategoryModel, null, 2));
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkCategories();
