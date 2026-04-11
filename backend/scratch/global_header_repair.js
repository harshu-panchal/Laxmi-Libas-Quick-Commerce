const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:11017/laxmart';

async function globalRepair() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Starting Global Header Repair (JS Version)...');

        const db = mongoose.connection.db;
        const categoriesColl = db.collection('categories');
        const headerCategoriesColl = db.collection('headercategories');

        const rootCategories = await categoriesColl.find({ parentId: null }).toArray();
        const headerCategories = await headerCategoriesColl.find({ status: 'Published' }).toArray();
        
        console.log(`Found ${rootCategories.length} root categories and ${headerCategories.length} headers.`);

        const headerMap = new Map();
        headerCategories.forEach(hc => {
            headerMap.set(hc.name.toLowerCase().trim(), hc._id);
            headerMap.set(hc.slug.toLowerCase().trim(), hc._id);
        });

        let fixedCount = 0;
        let clearedCount = 0;

        for (const cat of rootCategories) {
            const currentHeaderId = cat.headerCategoryId;
            
            // Check if current ID exists in HeaderCategory collection
            const exists = currentHeaderId ? headerCategories.find(hc => hc._id.toString() === currentHeaderId.toString()) : false;

            if (!exists) {
                console.log(`[ORPHAN] ${cat.name} has invalid link: ${currentHeaderId}`);
                
                // Try to find a match by name
                const matchName = cat.name.toLowerCase().trim();
                let matchedId = null;

                // Priority matching logic
                if (headerMap.has(matchName)) {
                    matchedId = headerMap.get(matchName);
                } else if (matchName.includes('fashion') || matchName.includes('clothing') || matchName.includes('footwear')) {
                    matchedId = headerMap.get('fashion');
                } else if (matchName.includes('electronics') || matchName.includes('mobiles')) {
                    matchedId = headerMap.get('electronics') || headerMap.get('mobiles');
                } else if (matchName.includes('grocery') || matchName.includes('food')) {
                    matchedId = headerMap.get('grocery') || headerMap.get('food');
                } else if (matchName.includes('home') || matchName.includes('furniture')) {
                    matchedId = headerMap.get('home') || headerMap.get('furniture');
                }

                if (matchedId) {
                    await categoriesColl.updateOne({ _id: cat._id }, { $set: { headerCategoryId: matchedId } });
                    console.log(`  -> FIXED: Linked to matching header ID: ${matchedId}`);
                    fixedCount++;
                } else {
                    await categoriesColl.updateOne({ _id: cat._id }, { $set: { headerCategoryId: null } });
                    console.log(`  -> CLEARED: No logical match found.`);
                    clearedCount++;
                }
            }
        }

        console.log(`\nRepair Summary:`);
        console.log(` - Fixed/Re-linked: ${fixedCount}`);
        console.log(` - Cleared broken links: ${clearedCount}`);
        
        await mongoose.disconnect();
    } catch (err) {
        console.error('Repair failed:', err);
    }
}

globalRepair();
