import dotenv from "dotenv";
import connectDB from "../config/db";
import Customer from "../models/Customer";
import Seller from "../models/Seller";
import Delivery from "../models/Delivery";
import Category from "../models/Category";
import bcrypt from "bcrypt";

dotenv.config();

async function seedTargetUsers() {
  try {
    console.log("Connecting to Database...");
    await connectDB();
    console.log("Connected to Database.");

    const mobile = "7894561230";

    // 1. Seed Customer
    console.log("Seeding Customer...");
    const existingCustomer = await Customer.findOne({ phone: mobile });
    if (existingCustomer) {
      console.log(`Customer with mobile ${mobile} already exists.`);
    } else {
      await Customer.create({
        name: "Test Customer",
        phone: mobile,
        email: "customer789@laxmilibas.com",
        status: "Active",
        walletAmount: 500,
      });
      console.log(`✓ Customer created successfully with mobile ${mobile}`);
    }

    // 2. Seed Seller
    console.log("Seeding Seller...");
    const existingSeller = await Seller.findOne({ mobile });
    if (existingSeller) {
      console.log(`Seller with mobile ${mobile} already exists.`);
    } else {
      // Find or create a category for Seller
      let category = await Category.findOne();
      if (!category) {
        category = await Category.create({
          name: "Default Category",
          description: "Default Category for seeding",
          status: "Active",
        });
        console.log(`✓ Created default Category: ${category.name}`);
      }

      const hashedPassword = await bcrypt.hash("password123", 10);

      await Seller.create({
        sellerName: "Test Seller",
        storeName: "Laxmi Libas Test Store",
        mobile: mobile,
        email: "seller789@laxmilibas.com",
        password: hashedPassword,
        category: category._id,
        address: "Test Store Address, Main Market",
        status: "Approved",
        commission: 10,
        balance: 1000,
        businessType: "product",
      });
      console.log(`✓ Seller created successfully with mobile ${mobile}`);
    }

    // 3. Seed Delivery Boy
    console.log("Seeding Delivery Boy...");
    const existingDelivery = await Delivery.findOne({ mobile });
    if (existingDelivery) {
      console.log(`Delivery partner with mobile ${mobile} already exists.`);
    } else {
      const hashedPassword = await bcrypt.hash("password123", 10);
      await Delivery.create({
        name: "Test Delivery Partner",
        mobile: mobile,
        email: "delivery789@laxmilibas.com",
        password: hashedPassword,
        status: "Approved",
        balance: 200,
        cashCollected: 0,
      });
      console.log(`✓ Delivery partner created successfully with mobile ${mobile}`);
    }

    console.log("\n🎉 Seeding Completed Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    process.exit(1);
  }
}

seedTargetUsers();
