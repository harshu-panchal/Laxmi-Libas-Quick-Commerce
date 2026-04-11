import mongoose from 'mongoose';
import HeaderCategory from './src/models/HeaderCategory';
import * as dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/laxmart';

async function checkGrocery() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');
    const grocery = await HeaderCategory.findOne({ $or: [{ slug: 'grocery' }, { name: 'Grocery' }] });
    if (grocery) {
      console.log('Grocery category found:');
      console.log(JSON.stringify(grocery, null, 2));
    } else {
      console.log('Grocery category NOT found in database.');
    }
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkGrocery();
