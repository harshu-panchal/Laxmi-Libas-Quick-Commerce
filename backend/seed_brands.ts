import mongoose from 'mongoose';
import Brand from './src/models/Brand';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        
        const fashionBrands = [
            "Nike", "Adidas", "Levi's", "Gucci", "Zara", "H&M", "Puma", "Raymond", "Manyavar"
        ];
        
        for (const name of fashionBrands) {
            const existing = await Brand.findOne({ name });
            if (!existing) {
                await Brand.create({ name });
                console.log(`Created brand: ${name}`);
            }
        }
        
        await mongoose.connection.close();
        console.log("Seeding complete.");
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
