import { Request, Response } from "express";
import Product from "../../../models/Product";
import Category from "../../../models/Category";
import SubCategory from "../../../models/SubCategory";
import Seller from "../../../models/Seller";
import mongoose from "mongoose";
// import { findSellersWithinRange } from "../../../utils/locationHelper";

// Get products with filtering options (public)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      category,
      subcategory,
      search,
      page = 1,
      limit = 20,
      sort,
      minPrice,
      maxPrice,
      brand,
      minDiscount,
    } = req.query;

    console.log(`[getProducts] Incoming Request - Category: ${category}, Search: ${search}`);

    // REQUIRE category or search - strict rule
    /* Category requirement relaxed for home page sections */
    /*
    if (!category && !search) {
      console.warn("[getProducts] Missing category or search parameter");
      return res.status(400).json({
        success: false,
        message: "Category is required for listing products",
      });
    }
    */

    const query: any = {
      status: "Active",
      publish: true,
      $or: [
        { isShopByStoreOnly: { $ne: true } },
        { isShopByStoreOnly: { $exists: false } },
      ],
    };

    // Filter by approved sellers
    const approvedSellers = await Seller.find({ status: "Approved" }).select("_id");
    if (approvedSellers.length > 0) {
      query.seller = { $in: approvedSellers.map((s) => s._id) };
    } else {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { page: Number(page), limit: Number(limit), total: 0, pages: 0 },
      });
    }

    // Helper to resolve category ID from slug/name strictly
    const resolveId = async (model: any, value: string, modelName: string) => {
      if (mongoose.Types.ObjectId.isValid(value)) return value;

      const normalizedValue = value.toLowerCase().trim();
      const baseQuery: any = modelName === "Category" ? { status: "Active" } : {};

      // Try exact slug
      let item = await model.findOne({ ...baseQuery, slug: normalizedValue }).select("_id").lean();
      if (item) return item._id;

      // Try name match (case-insensitive)
      const namePattern = normalizedValue.replace(/[-_]/g, " ");
      item = await model.findOne({
        ...baseQuery,
        name: { $regex: new RegExp(`^${namePattern}$`, "i") }
      }).select("_id").lean();
      
      return item ? item._id : null;
    };

    if (category) {
      // 1. Try to resolve as a regular Category
      let catId = await resolveId(Category, category as string, "Category");
      
      if (catId) {
        query.category = catId;
        console.log(`[getProducts] Filter Applied - CategoryId: ${catId}`);
      } else {
        // 2. Fallback: Try to resolve as a HeaderCategory if no Category matched
        const HeaderCategoryModel = require("../../../models/HeaderCategory").default;
        const headerId = await resolveId(HeaderCategoryModel, category as string, "HeaderCategory");
        
        if (headerId) {
          query.headerCategoryId = headerId;
          console.log(`[getProducts] Filter Applied - HeaderCategoryId: ${headerId}`);
        } else {
          console.warn(`[getProducts] Category/HeaderCategory NOT FOUND for: ${category}`);
          return res.status(200).json({
            success: true,
            data: [],
            pagination: { page: Number(page), limit: Number(limit), total: 0, pages: 0 },
          });
        }
      }
    }

    if (subcategory) {
      const subId = await resolveId(Category, subcategory as string, "Category") || 
                   await resolveId(SubCategory, subcategory as string, "SubCategory");
      if (subId) query.subcategory = subId;
    }

    if (brand) query.brand = brand;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (minDiscount) query.discount = { $gte: Number(minDiscount) };
    if (search) query.$text = { $search: search as string };

    const skip = (Number(page) - 1) * Number(limit);
    let sortOptions: any = { createdAt: -1 };
    if (sort === "price_asc") sortOptions = { price: 1 };
    if (sort === "price_desc") sortOptions = { price: -1 };
    if (sort === "discount") sortOptions = { discount: -1 };

    const products = await Product.find(query)
      .populate("category", "name slug")
      .populate("subcategory", "name")
      .populate("seller", "storeName")
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);
    console.log(`[getProducts] Returned ${products.length} products for query:`, JSON.stringify(query));

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error("[getProducts] ERROR:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
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
        "storeName mobile city fssaiLicNo address location serviceRadiusKm"
      );

    if (!product) {
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
    // Filter by location
    const similarProductsQuery: any = {
      _id: { $ne: product._id },
      status: "Active",
      publish: true,
      // Exclude shop-by-store-only products from similar products
      $or: [
        { isShopByStoreOnly: { $ne: true } },
        { isShopByStoreOnly: { $exists: false } },
      ],
    };

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

    return res.status(200).json({
      success: true,
      data: {
        ...product.toObject(),
        similarProducts,
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
