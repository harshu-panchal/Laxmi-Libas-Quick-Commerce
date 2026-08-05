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
    const indoreLat = 22.726115;
    const indoreLng = 75.882596;
    const indoreCity = "Indore";
    const indoreAddress = "Palasia, Indore, Madhya Pradesh 452001";

    // 1. Seed Customer
    console.log("Seeding Customer with Indore Location...");
    let customer = await Customer.findOne({ phone: mobile });
    const customerData = {
      name: "Test Customer",
      phone: mobile,
      email: "customer789@laxmilibas.com",
      status: "Active" as const,
      walletAmount: 500,
      city: indoreCity,
      address: indoreAddress,
      state: "Madhya Pradesh",
      pincode: "452001",
      latitude: indoreLat,
      longitude: indoreLng,
    };

    if (customer) {
      Object.assign(customer, customerData);
      await customer.save();
      console.log(`✓ Customer with mobile ${mobile} updated with Indore location.`);
    } else {
      await Customer.create(customerData);
      console.log(`✓ Customer created successfully with mobile ${mobile} and Indore location.`);
    }

    // 2. Seed Seller
    console.log("Seeding Seller with Indore Location...");
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
      storeName: "Laxmi Libas Indore Store",
      mobile: mobile,
      email: "seller789@laxmilibas.com",
      category: category._id,
      address: "Rajwada Market, Indore, Madhya Pradesh 452002",
      city: indoreCity,
      latitude: indoreLat.toString(),
      longitude: indoreLng.toString(),
      location: {
        type: "Point" as const,
        coordinates: [indoreLng, indoreLat],
      },
      serviceRadiusKm: 50,
      isShopOpen: true,
      status: "Approved" as const,
      commission: 10,
      balance: 1000,
      businessType: "product" as const,
    };

    if (seller) {
      Object.assign(seller, sellerData);
      await seller.save();
      console.log(`✓ Seller with mobile ${mobile} updated to Approved with Indore location.`);
    } else {
      await Seller.create({
        ...sellerData,
        password: hashedPassword,
      });
      console.log(`✓ Seller created successfully with mobile ${mobile} and Indore location.`);
    }

    // Also update all existing sellers without location or city to Indore
    const updatedSellers = await Seller.updateMany(
      { $or: [{ city: { $exists: false } }, { city: "" }, { city: null }] },
      {
        $set: {
          city: indoreCity,
          latitude: indoreLat.toString(),
          longitude: indoreLng.toString(),
          location: {
            type: "Point",
            coordinates: [indoreLng, indoreLat],
          },
          serviceRadiusKm: 50,
          isShopOpen: true,
        },
      }
    );
    console.log(`✓ Updated ${updatedSellers.modifiedCount} existing sellers to Indore location.`);

    // 3. Seed Delivery Boy
    console.log("Seeding Delivery Boy with Indore Location...");
    let delivery = await Delivery.findOne({ mobile });
    const deliveryData = {
      name: "Test Delivery Partner",
      mobile: mobile,
      email: "delivery789@laxmilibas.com",
      address: "Vijay Nagar, Indore, Madhya Pradesh 452010",
      city: indoreCity,
      pincode: "452010",
      status: "Approved" as const,
      isOnline: true,
      location: {
        type: "Point" as const,
        coordinates: [indoreLng, indoreLat],
      },
      balance: 200,
      cashCollected: 0,
    };

    if (delivery) {
      Object.assign(delivery, deliveryData);
      await delivery.save();
      console.log(`✓ Delivery partner with mobile ${mobile} updated to Approved with Indore location.`);
    } else {
      await Delivery.create({
        ...deliveryData,
        password: hashedPassword,
      });
      console.log(`✓ Delivery partner created successfully with mobile ${mobile} and Indore location.`);
    }

    // Update all delivery partners to Indore and Online
    const updatedDeliveries = await Delivery.updateMany(
      {},
      {
        $set: {
          city: indoreCity,
          status: "Approved",
          isOnline: true,
          location: {
            type: "Point",
            coordinates: [indoreLng, indoreLat],
          },
        },
      }
    );
    console.log(`✓ Updated ${updatedDeliveries.modifiedCount} delivery partners to Indore location & Online status.`);

    console.log("\n🎉 All Test Users & Locations Seeded to Indore Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    process.exit(1);
  }
}

seedTargetUsers();
