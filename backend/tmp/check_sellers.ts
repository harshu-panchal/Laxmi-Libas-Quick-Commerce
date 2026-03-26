import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const SellerSchema = new mongoose.Schema({
  sellerName: String,
  email: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  categories: [String],
});

const CategorySchema = new mongoose.Schema({
  name: String,
});

async function checkSellers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected to MongoDB');

    // Manually register models
    const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
    const Seller = mongoose.models.Seller || mongoose.model('Seller', SellerSchema);

    const sellers = await Seller.find({}).populate('category');
    console.log('Sellers found:', sellers.length);
    sellers.forEach((s: any) => {
      console.log(`Seller: ${s.sellerName}, Email: ${s.email}`);
      console.log(`  Category ID: ${s.category?._id}, Category Name: ${s.category?.name}`);
      console.log(`  Categories text: ${JSON.stringify(s.categories)}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSellers();
