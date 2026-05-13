const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const db = mongoose.connection.db;
        const p = await db.collection("products").findOne({ _id: new mongoose.Types.ObjectId("69f6cbe01625295397262834") });
        console.log("Full Product Document for HALF SHIRT:", JSON.stringify(p, null, 2));
    } finally {
        await mongoose.disconnect();
    }
}
run();
