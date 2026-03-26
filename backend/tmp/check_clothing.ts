import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const CategorySchema = new mongoose.Schema({
  name: String,
  parentId: mongoose.Schema.Types.ObjectId,
  status: String,
});

const Category = mongoose.model('Category', CategorySchema);

async function checkCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected to MongoDB');

    const allClothing = await Category.find({ name: /Clothing/i });
    console.log('All Clothing Categories found:', allClothing.length);
    allClothing.forEach(cat => {
      console.log(`ID: ${cat._id}, Name: ${cat.name}, status: ${cat.status}, parentId: ${cat.parentId}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkCategories();
