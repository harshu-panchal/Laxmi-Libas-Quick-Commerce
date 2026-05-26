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
    let customer = await Customer.findOne({ phone: mobile });
    if (customer) {
      customer.status = "Active";
      customer.name = "Test Customer";
      customer.email = "customer789@laxmilibas.com";
      await customer.save();
      console.log(`✓ Customer with mobile ${mobile} updated to Active.`);
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
    let seller = await Seller.findOne({ mobile });
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
    const sellerData = {
      sellerName: "Test Seller",
      storeName: "Laxmi Libas Test Store",
      mobile: mobile,
      email: "seller789@laxmilibas.com",
      category: category._id,
      address: "Test Store Address, Main Market",
      status: "Approved" as const,
      commission: 10,
      balance: 1000,
      businessType: "product" as const,
    };

    if (seller) {
      Object.assign(seller, sellerData);
      await seller.save();
      console.log(`✓ Seller with mobile ${mobile} updated to Approved.`);
    } else {
      await Seller.create({
        ...sellerData,
        password: hashedPassword,
      });
      console.log(`✓ Seller created successfully with mobile ${mobile}`);
    }

    // 3. Seed Delivery Boy
    console.log("Seeding Delivery Boy...");
    let delivery = await Delivery.findOne({ mobile });
    const deliveryData = {
      name: "Test Delivery Partner",
      mobile: mobile,
      email: "delivery789@laxmilibas.com",
      status: "Approved" as const,
      balance: 200,
      cashCollected: 0,
    };

    if (delivery) {
      Object.assign(delivery, deliveryData);
      await delivery.save();
      console.log(`✓ Delivery partner with mobile ${mobile} updated to Approved.`);
    } else {
      await Delivery.create({
        ...deliveryData,
        password: hashedPassword,
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
