import mongoose from 'mongoose';
import HeaderCategory from './src/models/HeaderCategory';
import * as dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/laxmart';

async function repair() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Repairing grocery category slug...');

        // Find the grocery category with 'all' slug
        const grocery = await HeaderCategory.findOne({ name: /grocery/i, slug: 'all' });
        if (grocery) {
            grocery.slug = 'grocery';
            // Ensure it has the correct theme as well (grocery color is light-green)
            if (!grocery.get('theme')) {
                grocery.set('theme', 'grocery');
            }
            await grocery.save();
            console.log('REPAIRED: grocery category slug updated to grocery');
        } else {
            console.log('Could not find grocery category with slug all');
        }

        // Double check for any other 'all' slugs
        const allCats = await HeaderCategory.find({ slug: 'all' });
        for (const cat of allCats) {
            if (cat.name.toLowerCase().includes('for you')) continue;
            
            console.log('Found another clash:', cat.name);
            cat.slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            await cat.save();
            console.log('REPAIRED:', cat.name, 'slug updated to', cat.slug);
        }

        await mongoose.disconnect();
        console.log('Cleanup complete.');
    } catch (err) {
        console.error('Error during repair:', err);
    }
}

repair();
