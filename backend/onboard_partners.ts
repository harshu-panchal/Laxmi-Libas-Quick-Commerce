import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Seller from './src/models/Seller';
import Otp from './src/models/Otp';
import Category from './src/models/Category';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const onboardSellers = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Ensure Categories exist
    let hotelCat = await Category.findOne({ name: 'Hotel' });
    if (!hotelCat) {
      hotelCat = await Category.create({
        name: 'Hotel',
        slug: 'hotel',
        status: 'Active',
        order: 1
      });
      console.log('Created Hotel category');
    }

    let busCat = await Category.findOne({ name: 'Bus' });
    if (!busCat) {
      busCat = await Category.create({
        name: 'Bus',
        slug: 'bus',
        status: 'Active',
        order: 2
      });
      console.log('Created Bus category');
    }

    const mobile = '7867867867';
    const otpValue = '1234';

    // 2. Create/Update Seller
    // We create one seller with both business types since mobile must be unique
    let seller = await Seller.findOne({ mobile });
    
    const sellerData = {
      sellerName: 'Hotel & Bus Partner',
      storeName: 'Laxmart Stay & Travel',
      email: 'partner@laxmart.store',
      mobile: mobile,
      status: 'Approved',
      businessTypes: ['hotel', 'bus'],
      businessType: 'hotel', // Default primary type
      categories: [hotelCat._id, busCat._id],
      commission: 10,
      isShopOpen: true,
      address: 'Laxmart HQ, City Center',
      city: 'Ujjain'
    };

    if (seller) {
      Object.assign(seller, sellerData);
      await seller.save();
      console.log('Updated existing seller');
    } else {
      seller = await Seller.create(sellerData);
      console.log('Created new seller');
    }

    // 3. Create/Update OTP
    await Otp.deleteMany({ mobile, userType: 'Seller' });
    await Otp.create({
      mobile,
      otp: otpValue,
      userType: 'Seller',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Valid for 1 year for testing
      isVerified: false
    });
    console.log(`Created OTP ${otpValue} for ${mobile}`);

    console.log('Onboarding successful!');
    process.exit(0);
  } catch (error) {
    console.error('Error during onboarding:', error);
    process.exit(1);
  }
};

onboardSellers();
