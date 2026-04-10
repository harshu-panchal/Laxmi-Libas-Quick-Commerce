import mongoose from "mongoose";
import dotenv from "dotenv";
import Delivery from "../models/Delivery";
import Seller from "../models/Seller";

dotenv.config({ path: __dirname + "/../../.env" });
// Path check (might need adjusted .env)
dotenv.config();

async function checkLocations() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("Connected to MongoDB.");

        const sellers = await Seller.find({}).limit(5).select('storeName latitude longitude location');
        console.log("Sellers:");
        sellers.forEach(s => console.log(` - ${s.storeName}: Lat=${s.latitude}, Lng=${s.longitude}, GeoJSON=${JSON.stringify(s.location)}`));

        const boys = await Delivery.find({}).limit(5).select('name latitude longitude location isOnline status');
        console.log("Delivery Boys:");
        boys.forEach(b => console.log(` - ${b.name}: Online=${b.isOnline}, Status=${b.status}, GeoJSON=${JSON.stringify(b.location)}`));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
checkLocations();
