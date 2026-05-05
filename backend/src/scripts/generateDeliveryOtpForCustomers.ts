import dotenv from "dotenv";
import mongoose from "mongoose";
import Customer from "../models/Customer";
import connectDB from "../config/db";

dotenv.config();

/**
 * Generate random 4-digit OTP (1000-9999)
 */
function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Main script to generate delivery OTPs for existing customers who don't have one
 */
async function generateDeliveryOtpForCustomers() {
  const isDryRun = process.argv.includes("--dry-run");

  if (isDryRun) {
    console.log("\n🔍 DRY RUN MODE - No changes will be made\n");
  }

  try {
    await connectDB();

    // Find all customers to update their OTP to phone-based one
    const allCustomers = await Customer.find({}).select("_id name phone");
    const customersToUpdate = allCustomers.length;

    console.log(`📊 Total customers to update: ${customersToUpdate}`);

    if (customersToUpdate === 0) {
      console.log("\n✅ No customers found. Nothing to do.\n");
      process.exit(0);
    }

    if (isDryRun) {
      console.log("\n📝 Customers that would be updated:");
      allCustomers.slice(0, 10).forEach((c) => {
        const phoneLast4 = c.phone ? c.phone.slice(-4) : "0000";
        console.log(`   - ${c.name} (${c.phone}) -> OTP: ${phoneLast4}`);
      });
      if (allCustomers.length > 10) {
        console.log(`   ... and ${allCustomers.length - 10} more`);
      }
      console.log("\n🔍 Dry run complete. Run without --dry-run to apply changes.\n");
      process.exit(0);
    }

    // Generate OTPs based on phone and prepare bulk operations
    console.log("\n⏳ Updating delivery OTPs based on phone numbers...\n");

    const bulkOps = allCustomers.map((customer) => {
      const phoneLast4 = customer.phone ? customer.phone.slice(-4) : "0000";
      return {
        updateOne: {
          filter: { _id: customer._id },
          update: { $set: { deliveryOtp: phoneLast4 } },
        },
      };
    });

    // Execute bulk update
    const result = await Customer.bulkWrite(bulkOps);

    console.log("✅ Delivery OTP generation complete!");
    console.log(`   📊 Modified: ${result.modifiedCount} customers`);
    console.log(`   📊 Matched: ${result.matchedCount} customers\n`);

    // Verify by showing a few examples
    const updatedSamples = await Customer.find({
      _id: { $in: customersWithoutOtp.slice(0, 3).map((c) => c._id) },
    }).select("name phone deliveryOtp");

    if (updatedSamples.length > 0) {
      console.log("📌 Sample updated customers:");
      updatedSamples.forEach((c) => {
        console.log(`   - ${c.name} (${c.phone}): OTP = ${c.deliveryOtp}`);
      });
      console.log("");
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error generating delivery OTPs:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

generateDeliveryOtpForCustomers();

