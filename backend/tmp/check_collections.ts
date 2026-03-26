import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkCollections() {
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected to MongoDB');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCollections();
