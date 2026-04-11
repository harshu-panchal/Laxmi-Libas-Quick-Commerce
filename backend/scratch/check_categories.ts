import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/laxmart';

const CategorySchema = new mongoose.Schema({
    name: String,
    slug: String,
    parentId: mongoose.Schema.Types.ObjectId,
    headerCategoryId: mongoose.Schema.Types.ObjectId,
}, { strict: false });

const HeaderCategorySchema = new mongoose.Schema({
    name: String,
    slug: String,
    status: String,
}, { strict: false });

const Category = mongoose.model('Category', CategorySchema);
const HeaderCategory = mongoose.model('HeaderCategory', HeaderCategorySchema);

async function check() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to DB');

        const rootCats = await Category.find({ parentId: null });
        console.log(`Found ${rootCats.length} root categories:`);
        
        const headerCats = await HeaderCategory.find({ status: 'Published' });
        console.log(`Found ${headerCats.length} published header categories:`);

        for (const cat of rootCats) {
            console.log(`- ${cat.name} (Header: ${cat.headerCategoryId || 'NONE'})`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

check();
