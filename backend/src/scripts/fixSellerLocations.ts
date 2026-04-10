import mongoose from "mongoose";
import dotenv from "dotenv";
import Seller from "../models/Seller";

dotenv.config({ path: __dirname + "/../../.env" });
dotenv.config();

async function fixSellerLocations() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("Connected to MongoDB.");

        // Update all sellers to a valid location in Indore
        const indoreLocation = {
            type: "Point",
            coordinates: [75.90, 22.71]
        };

        const result = await Seller.updateMany(
            {}, 
            { 
                $set: { 
                    location: indoreLocation,
                    latitude: "22.71",
                    longitude: "75.90",
                    serviceRadiusKm: 40
                } 
            }
        );

        console.log(`Updated ${result.modifiedCount} sellers to valid location!`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
fixSellerLocations();
