import { Request, Response } from "express";
import Product from "../../../models/Product";
import Category from "../../../models/Category";
import SubCategory from "../../../models/SubCategory";
import Seller from "../../../models/Seller";
import mongoose from "mongoose";
// import { findSellersWithinRange } from "../../../utils/locationHelper";

// Get products with hybrid filtering (Smart Decision Engine)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      lat,
      lng,
      pincode,
      categoryId,
      limit = 20,
      page = 1
    } = req.query;

    const limitNum = Number(limit);
    const skip = (Number(page) - 1) * limitNum;
    const userLat = lat ? Number(lat) : null;
    const userLng = lng ? Number(lng) : null;
    const userPincode = pincode ? String(pincode).trim() : null;

    // ── Base query for active, published, approved-seller products ──────────
    const baseQuery: any = { status: 'Active', publish: true };
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId as string)) {
      baseQuery.category = new mongoose.Types.ObjectId(categoryId as string);
    }

    // ── Fetch Quick (location-based) products ───────────────────────────────
    let quickProducts: any[] = [];
    if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
      // Use MongoDB $nearSphere with the 2dsphere index (max 40km default)
      const maxRadiusMeters = 40 * 1000; // 40 km
      const quickQuery = {
        ...baseQuery,
        type: { $in: ['quick', 'both'] },
        location: {
          $nearSphere: {
            $geometry: { type: 'Point', coordinates: [userLng, userLat] },
            $maxDistance: maxRadiusMeters,
          },
        },
      };
      quickProducts = await Product.find(quickQuery)
        .populate('category', 'name')
        .populate('seller', 'storeName location serviceRadiusKm')
        .limit(limitNum)
        .skip(skip)
        .lean();
    }

    // ── Fetch Ecommerce (pincode-based) products ────────────────────────────
    let ecommerceProducts: any[] = [];
    if (userPincode) {
      const ecomQuery = {
        ...baseQuery,
        type: { $in: ['ecommerce', 'both'] },
        availablePincodes: userPincode,  // direct array includes match
      };
      ecommerceProducts = await Product.find(ecomQuery)
        .populate('category', 'name')
        .populate('seller', 'storeName location serviceRadiusKm')
        .limit(limitNum)
        .skip(skip)
        .lean();
    }

    // ── If no location/pincode given, fall back to all active products ───────
    let fallbackProducts: any[] = [];
    if (!userLat && !userPincode) {
      fallbackProducts = await Product.find(baseQuery)
        .populate('category', 'name')
        .populate('seller', 'storeName')
        .limit(limitNum)
        .skip(skip)
        .lean();
    }

    // ── Merge and deduplicate by _id ─────────────────────────────────────────
    const allRaw = [...quickProducts, ...ecommerceProducts, ...fallbackProducts];
    const seen = new Set<string>();
    const hybridProducts = allRaw
      .filter((p: any) => {
        const id = p._id.toString();
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((product: any) => {
        const nearbyAvailable  = quickProducts.some((q: any) => q._id.toString() === product._id.toString());
        const ecommerceAvailable = ecommerceProducts.some((e: any) => e._id.toString() === product._id.toString());
        return {
          productId: product._id,
          ...product,
          nearbyAvailable,
          ecommerceAvailable,
          quickPrice: product.discPrice || product.price,
          ecommercePrice: product.discPrice || product.price,
          deliveryTimeQuick: '30-45 min',
          deliveryTimeEcommerce: '3-5 days',
        };
      });

    return res.status(200).json({ success: true, data: hybridProducts });

  } catch (error: any) {
    console.error('[getProducts] Decision Engine ERROR:', error.message);
    return res.status(500).json({ success: false, message: 'Error fetching products', error: error.message });
  }
};

// Get single product by ID (public)
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // latitude and longitude    // const { latitude, longitude } = req.query; // User location
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findOne({
      _id: id,
      status: "Active",
      publish: true,
    })
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("brand", "name")
      .populate(
        "seller",
        "storeName mobile city fssaiLicNo address location serviceRadiusKm status"
      );

    if (!product || (product.seller as any)?.status !== "Approved") {
      return res.status(404).json({
        success: false,
        message: "Product not found or unavailable",
      });
    }

    // Parse location (unused but kept for potential future use)
    // const userLat = latitude ? parseFloat(latitude as string) : null;
    // const userLng = longitude ? parseFloat(longitude as string) : null;
    const seller = product.seller as any;

    // Initialize availability flag - Always true as per user request
    let isAvailableAtLocation = true;

    // Safely get seller ID - handle both populated and unpopulated cases
    // let sellerId: mongoose.Types.ObjectId | null = null;
    if (seller) {
      if (typeof seller === "object" && seller._id) {
        // Seller is populated
        // sellerId = seller._id;
      } else if (seller instanceof mongoose.Types.ObjectId) {
        // Seller is an ObjectId (not populated)
        // sellerId = seller;
      } else if (typeof seller === "string") {
        // Seller is a string ID
        // sellerId = new mongoose.Types.ObjectId(seller);
      }
    }

    // Location check removed as per user request to allow delivery anywhere
    /*
    if (
      userLat &&
      userLng &&
      !isNaN(userLat) &&
      !isNaN(userLng) &&
      sellerId &&
      seller?.location
    ) {
      const nearbySellerIds = await findSellersWithinRange(userLat, userLng);
      isAvailableAtLocation = nearbySellerIds.some(
        (id) => id.toString() === sellerId!.toString()
      );
    }
    */

    // Find similar products (by category)
    const similarProductsQuery: any = {
      _id: { $ne: product._id },
      status: "Active",
      publish: true,
      $or: [
        { isShopByStoreOnly: { $ne: true } },
        { isShopByStoreOnly: { $exists: false } },
      ],
    };

    // Filter similar products by approved sellers only
    const approvedSellers = await Seller.find({ status: "Approved" }).select("_id");
    if (approvedSellers.length > 0) {
      similarProductsQuery.seller = { $in: approvedSellers.map((s) => s._id) };
    } else {
      similarProductsQuery.seller = { $in: [] };
    }

    // Safely get category ID - handle both populated and unpopulated cases
    let categoryId: mongoose.Types.ObjectId | null = null;
    if (product.category) {
      if (
        typeof product.category === "object" &&
        (product.category as any)._id
      ) {
        // Category is populated
        categoryId = (product.category as any)._id;
      } else if (product.category instanceof mongoose.Types.ObjectId) {
        // Category is an ObjectId (not populated)
        categoryId = product.category;
      } else if (typeof product.category === "string") {
        // Category is a string ID
        categoryId = new mongoose.Types.ObjectId(product.category);
      }
    }

    // Only add category filter if we have a valid category ID
    if (categoryId) {
      similarProductsQuery.category = categoryId;
    }

    // Location filtering for similar products removed as per user request
    /*
    if (userLat && userLng && !isNaN(userLat) && !isNaN(userLng)) {
      const nearbySellerIds = await findSellersWithinRange(userLat, userLng);
      if (nearbySellerIds.length > 0) {
        similarProductsQuery.seller = { $in: nearbySellerIds };
      } else {
        // No sellers nearby, return empty similar products
        similarProductsQuery.seller = { $in: [] };
      }
    }
    */

    const similarProducts = await Product.find(similarProductsQuery)
      .limit(6)
      .select(
        "productName price mrp mainImage pack discount _id rating reviewsCount"
      );

    // Fetch Color Variations if colorGroupId exists
    let colorVariations: any[] = [];
    if (product.colorGroupId) {
      colorVariations = await Product.find({
        colorGroupId: product.colorGroupId,
        _id: { $ne: product._id },
        status: "Active",
        publish: true,
      }).select("productName mainImage color _id");
    }

    return res.status(200).json({
      success: true,
      data: {
        ...product.toObject(),
        similarProducts,
        colorVariations, // Include color variations for the thumbnails UI
        isAvailableAtLocation, // Add availability flag to response
      },
    });
  } catch (error: any) {
    console.error("Error in getProductById:", {
      productId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Error fetching product details",
      error: error.message,
    });
  }
};
