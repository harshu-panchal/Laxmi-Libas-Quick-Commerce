import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product";
import Seller from "../models/Seller";
import { normalizeCity } from "../utils/locationUtils";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Database connected successfully!");

    // Helper to simulate getQuickProducts query logic
    const runQuery = async (userCityParam: string | undefined) => {
      console.log(`\n--- TESTING WITH CITY: "${userCityParam}" ---`);
      
      const query: any = { 
        status: 'Active', 
        publish: true,
        type: { $in: ['quick', 'both'] }
      };

      if (userCityParam) {
        const normalizedCity = normalizeCity(userCityParam);
        const sellersInCity = await Seller.find({ 
          city: { $regex: new RegExp(`^${normalizedCity}$`, 'i') }, 
          status: 'Approved' 
        }).select('_id');
        const sellerIds = sellersInCity.map(s => s._id);
        console.log(`Found ${sellerIds.length} approved sellers in "${normalizedCity}":`, sellerIds);
        query.seller = { $in: sellerIds };
      } else {
        const approvedSellers = await Seller.find({ status: 'Approved' }).select('_id');
        query.seller = { $in: approvedSellers.map(s => s._id) };
        console.log(`Found ${approvedSellers.length} approved sellers globally:`, approvedSellers.map(s => s._id));
      }

      console.log("Query object:", JSON.stringify(query, null, 2));

      const count = await Product.countDocuments(query);
      console.log("Count of products found:", count);

      const products = await Product.find(query).populate('seller').limit(3).lean();
      console.log("Sample products:", products.map((p: any) => ({
        name: p.productName || p.name,
        status: p.status,
        publish: p.publish,
        type: p.type,
        sellerStoreName: p.seller?.storeName,
        sellerCity: p.seller?.city
      })));
    };

    await runQuery("Noamundi");
    await runQuery("noamundi");
    await runQuery("Indore");
    await runQuery(undefined);

  } catch (err) {
    console.error("Execution failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
