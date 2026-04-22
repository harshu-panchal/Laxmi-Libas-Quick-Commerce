import { Request, Response } from "express";
import Seller from "../../../models/Seller";
import {
  sendOTP as sendOTPService,
  verifyOTP as verifyOTPService,
} from "../../../services/otpService";
import { generateToken } from "../../../services/jwtService";
import { asyncHandler } from "../../../utils/asyncHandler";
import Category from "../../../models/Category";
import mongoose from "mongoose";

/**
 * Send OTP to seller mobile number
 */
export const sendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { mobile } = req.body;

  if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Valid 10-digit mobile number is required",
    });
  }

  // Check if seller exists with this mobile
  const seller = await Seller.findOne({ mobile });
  if (!seller) {
    return res.status(404).json({
      success: false,
      message: "Seller not found with this mobile number",
    });
  }

  // Send OTP - for login, always use default OTP
  const result = await sendOTPService(mobile, "Seller", true);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Verify OTP and login seller
 */
export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const { mobile, otp } = req.body;

  if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Valid 10-digit mobile number is required",
    });
  }

  if (!otp || !/^[0-9]{4}$/.test(otp)) {
    return res.status(400).json({
      success: false,
      message: "Valid 4-digit OTP is required",
    });
  }

  // Verify OTP
  const isValid = await verifyOTPService(mobile, otp, "Seller");
  if (!isValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired OTP",
    });
  }

  // Find seller
  const seller = await Seller.findOne({ mobile }).select("-password");
  if (!seller) {
    return res.status(404).json({
      success: false,
      message: "Seller not found",
    });
  }

  // Block Rejected and Blocked sellers from logging in
  if (seller.status === 'Rejected') {
    return res.status(403).json({
      success: false,
      message: seller.rejectionReason
        ? `Your account application was rejected. Reason: ${seller.rejectionReason}`
        : "Your account application was rejected. Please contact support for more information.",
      status: 'rejected',
    });
  }

  if (seller.status === 'Blocked') {
    return res.status(403).json({
      success: false,
      message: seller.rejectionReason
        ? `Your account has been blocked. Reason: ${seller.rejectionReason}`
        : "Your account has been blocked. Please contact support for more information.",
      status: 'blocked',
    });
  }

  // Restrict login to ONLY Approved sellers
  if (seller.status !== 'Approved') {
    console.log(`[SellerAuth] Forbidden login attempt for ${mobile}. Status: "${seller.status}" (Expected: "Approved")`);
    return res.status(403).json({
      success: false,
      message: `Your account is currently ${seller.status}. You can only login once an admin has approved your application.`,
      status: seller.status.toLowerCase(),
    });
  }

  // Generate JWT token
  const token = generateToken(seller._id.toString(), "Seller", undefined, seller.category?.toString() || "");

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: {
        id: seller._id,
        sellerName: seller.sellerName,
        mobile: seller.mobile,
        email: seller.email,
        storeName: seller.storeName,
        status: seller.status,
        logo: seller.logo,
        address: seller.address,
        city: seller.city,
        categories: seller.categories,
        category: seller.category,
        businessType: seller.businessType,
        businessTypes: seller.businessTypes,
      },
    },
  });
});

/**
 * Register new seller
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const {
    sellerName,
    mobile,
    email,
    storeName,
    category,
    address,
    businessType,
    businessDetails,
  } = req.body;

  // Validation
  console.log("📥 Registration Request body:", JSON.stringify(req.body, null, 2));

  if (!sellerName || !mobile || !email || !businessType) {
    return res.status(400).json({
      success: false,
      message: "Basic details (Name, Mobile, Email, Business Type) are required",
    });
  }

  // Validation (password removed - sellers don't need password during signup)
  const isProductSeller = businessType === 'product';
  if (!sellerName || !mobile || !email || !storeName || (isProductSeller && (!category && (!req.body.categories || req.body.categories.length === 0)))) {
    const missing = [];
    if (!sellerName) missing.push("Name");
    if (!mobile) missing.push("Mobile");
    if (!email) missing.push("Email");
    if (!storeName) missing.push(isProductSeller ? "Store Name" : "Business Name");
    if (isProductSeller && !category && (!req.body.categories || req.body.categories.length === 0)) missing.push("Categories");

    return res.status(400).json({
      success: false,
      message: `Required fields missing: ${missing.join(", ")}`,
      debug: { businessType, isProductSeller, hasCategories: !!(req.body.categories?.length) }
    });
  }

  // Handle multi-category input: if category is missing but categories is present, use first one as primary
  let finalCategory = category;
  const finalCategories = req.body.categories || (category ? [category] : []);
  
  if (!finalCategory && finalCategories.length > 0) {
    finalCategory = finalCategories[0];
  }

  if (!/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Valid 10-digit mobile number is required",
    });
  }

  // Validate categories exist (only for product sellers)
  if (isProductSeller && finalCategories.length > 0) {
    for (const catId of finalCategories) {
      if (!mongoose.Types.ObjectId.isValid(catId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid Category ID: ${catId}`,
        });
      }
    }

    const existingCats = await Category.find({ _id: { $in: finalCategories } });
    if (existingCats.length !== finalCategories.length) {
      return res.status(400).json({
        success: false,
        message: "One or more selected categories do not exist.",
      });
    }
  }

  // All sellers must be approved by admin by default
  const shouldAutoApprove = false;

  // Check if seller already exists
  const existingSeller = await Seller.findOne({
    $or: [{ mobile }, { email }],
  });

  if (existingSeller) {
    return res.status(409).json({
      success: false,
      message: "Seller already exists with this mobile or email",
    });
  }

  const { latitude, longitude } = req.body;

  console.log(`📝 Registering new seller: ${storeName} (${email}), status set to: ${shouldAutoApprove ? "Approved" : "Pending"}`);

  const seller = await Seller.create({
    sellerName,
    mobile,
    email,
    storeName,
    category: finalCategory,
    categories: finalCategories,
    address,
    city: req.body.city,
    businessType,
    businessDetails: businessDetails || {},
    businessTypes: [businessType === 'product' ? 'commerce' : businessType],
    latitude: latitude || "",
    longitude: longitude || "",
    location: (latitude && longitude) ? {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    } : undefined,
    idProof: req.body.idProof,
    businessLicense: req.body.businessLicense,
    status: shouldAutoApprove ? "Approved" : "Pending",
    approvedAt: shouldAutoApprove ? new Date() : undefined,
    requireProductApproval: false,
    viewCustomerDetails: false,
    commission: 0,
    balance: 0,
  });

  console.log(`✅ Seller created successfully: ${seller.storeName} (ID: ${seller._id}), Final Status: ${seller.status}`);

  // Notify admin of new seller registration
  try {
    const io = (req.app as any).get("io");
    if (io) {
      io.to('admin').emit('new-seller-registered', {
        sellerId: seller._id,
        sellerName: seller.sellerName,
        storeName: seller.storeName,
        message: `New seller application from ${seller.storeName}`
      });
    }
  } catch (err) {
    console.error("Socket error notifying admin on seller registration:", err);
  }

  // Generate token only if auto-approved
  const token = shouldAutoApprove 
    ? generateToken(seller._id.toString(), "Seller", undefined, seller.category.toString())
    : undefined;

  return res.status(201).json({
    success: true,
    message: "Seller registered successfully. Awaiting admin approval before you can login.",
    data: {
      token,
      user: {
        id: seller._id,
        sellerName: seller.sellerName,
        mobile: seller.mobile,
        email: seller.email,
        storeName: seller.storeName,
        status: seller.status,
        address: seller.address,
        city: seller.city,
        categories: seller.categories,
        category: seller.category,
      },
    },
  });
});

/**
 * Get seller's profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;

  const seller = await Seller.findById(sellerId).select("-password");
  if (!seller) {
    return res.status(404).json({
      success: false,
      message: "Seller not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: seller,
  });
});

/**
 * Update seller's profile
 */
export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const updates = req.body;

    // Prevent updating sensitive fields directly
    const restrictedFields = [
      "password",
      "mobile",
      "email",
      "status",
      "balance",
      "category",
      "latitude",
      "longitude",
      "serviceRadiusKm",
      "location",
      "city",
      "serviceableArea",
    ];
    restrictedFields.forEach((field) => delete updates[field]);

    const seller = await Seller.findByIdAndUpdate(sellerId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: seller,
    });
  },
);

/**
 * Toggle shop status (Open/Close)
 */
export const toggleShopStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;

    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Shop status toggle logic
    seller.isShopOpen = !seller.isShopOpen;
    await seller.save();

    return res.status(200).json({
      success: true,
      message: `Shop is now ${seller.isShopOpen ? "Open" : "Closed"}`,
      data: { isShopOpen: seller.isShopOpen },
    });
  },
);
