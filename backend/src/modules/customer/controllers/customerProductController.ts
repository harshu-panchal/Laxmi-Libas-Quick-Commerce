import { Request, Response } from "express";
import Product from "../../../models/Product";
import Category from "../../../models/Category";
import SubCategory from "../../../models/SubCategory";
import Seller from "../../../models/Seller";
import HeaderCategory from "../../../models/HeaderCategory";
import mongoose from "mongoose";
import { normalizeCity, calculateDistance, getDeliveryTypeByDistance } from "../../../utils/locationUtils";
import { findSellersWithinRange } from "../../../utils/locationHelper";

/**
 * Helper to manually populate the subcategory field for products.
 * If the product's subcategory ID refers to a Category document (with parentId)
 * or a SubCategory document, we fetch the correct name/slug and standardise the field.
 */
const populateProductsSubcategory = async (products: any[]) => {
  if (!products || products.length === 0) return products;

  // Gather unique non-empty subcategory IDs
  const subcategoryIdsToResolve = new Set<string>();
  products.forEach((product) => {
    const subcat = product.subcategory || product.subCategoryId;
    if (subcat) {
      if (typeof subcat === "string") {
        if (mongoose.Types.ObjectId.isValid(subcat)) {
          subcategoryIdsToResolve.add(subcat);
        }
      } else if (subcat instanceof mongoose.Types.ObjectId) {
        subcategoryIdsToResolve.add(subcat.toString());
      } else if (typeof subcat === "object") {
        const idVal = subcat._id || subcat.id;
        if (idVal) {
          subcategoryIdsToResolve.add(idVal.toString());
        }
      }
    }
  });

  if (subcategoryIdsToResolve.size === 0) return products;

  const objectIds = Array.from(subcategoryIdsToResolve).map(id => new mongoose.Types.ObjectId(id));

  // Find matches in both Category and SubCategory models
  const [resolvedCats, resolvedSubs] = await Promise.all([
    Category.find({ _id: { $in: objectIds } }).select("_id name slug").lean(),
    SubCategory.find({ _id: { $in: objectIds } }).select("_id name").lean()
  ]);

  const subcategoryMap = new Map<string, { _id: any; name: string; slug: string }>();

  resolvedCats.forEach((cat) => {
    subcategoryMap.set(cat._id.toString(), {
      _id: cat._id,
      name: cat.name,
      slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    });
  });

  resolvedSubs.forEach((sub) => {
    if (!subcategoryMap.has(sub._id.toString())) {
      subcategoryMap.set(sub._id.toString(), {
        _id: sub._id,
        name: sub.name,
        slug: (sub as any).slug || sub.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      });
    }
  });

  // Attach resolved subcategories
  products.forEach((product) => {
    const subcat = product.subcategory || product.subCategoryId;
    if (subcat) {
      let subcatIdStr = "";
      if (typeof subcat === "string") {
        subcatIdStr = subcat;
      } else if (subcat instanceof mongoose.Types.ObjectId) {
        subcatIdStr = subcat.toString();
      } else if (typeof subcat === "object") {
        subcatIdStr = (subcat._id || subcat.id || "").toString();
      }

      if (subcategoryMap.has(subcatIdStr)) {
        const resolved = subcategoryMap.get(subcatIdStr)!;
        product.subcategory = resolved;
        product.subCategoryId = resolved;
      }
    }
  });

  return products;
};

// Get products with hybrid filtering (Smart Decision Engine)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      lat,
      lng,
      latitude,
      longitude,
      pincode,
      categoryId,
      category: categoryParam,
      subcategory: subcategoryParam,
      city: userCityParam,
      search,
      limit = 20,
      page = 1,
      sortBy,
      sort: sortParam
    } = req.query;

    const limitNum = Number(limit);
    const skip = (Number(page) - 1) * limitNum;
    
    // Support both 'lat'/'lng' and 'latitude'/'longitude'
    const userLat = (latitude || lat) ? Number(latitude || lat) : null;
    const userLng = (longitude || lng) ? Number(longitude || lng) : null;
    const userPincode = pincode ? String(pincode).trim() : null;

    // ── Base query for active, published, approved-seller products (Laxmart shows both types of products) ──
    const baseQuery: any = { status: 'Active', publish: true };
    
    const andConditions: any[] = [];
    
    // Use categoryId (legacy) or category parameter with robust ObjectId/Slug resolution
    const activeCategoryId = categoryId || categoryParam;
    if (activeCategoryId) {
      let resolvedCatIds: mongoose.Types.ObjectId[] = [];
      if (mongoose.Types.ObjectId.isValid(activeCategoryId as string)) {
        const objectId = new mongoose.Types.ObjectId(activeCategoryId as string);
        const headerCat = await HeaderCategory.findById(objectId).select('_id');
        
        if (headerCat) {
          // It's a HeaderCategory ID! Find all child Categories.
          const categoriesInHeader = await Category.find({ headerCategoryId: headerCat._id }).select('_id');
          const catIds = categoriesInHeader.map(c => c._id as mongoose.Types.ObjectId);
          resolvedCatIds = [...catIds];
          
          if (catIds.length > 0) {
            const childCats = await Category.find({ parentId: { $in: catIds } }).select('_id');
            if (childCats.length > 0) {
              resolvedCatIds.push(...childCats.map(c => c._id as mongoose.Types.ObjectId));
            }
            const legacySubs = await SubCategory.find({ category: { $in: catIds } }).select('_id');
            if (legacySubs.length > 0) {
              resolvedCatIds.push(...legacySubs.map(s => s._id as mongoose.Types.ObjectId));
            }
          }
        } else {
          // Standard Category ID
          resolvedCatIds = [objectId];
          const childCats = await Category.find({ parentId: objectId }).select('_id');
          if (childCats.length > 0) {
            resolvedCatIds.push(...childCats.map(c => c._id as mongoose.Types.ObjectId));
          }
          const legacySubs = await SubCategory.find({ category: objectId }).select('_id');
          if (legacySubs.length > 0) {
            resolvedCatIds.push(...legacySubs.map(s => s._id as mongoose.Types.ObjectId));
          }
        }
      } else {
        const resolvedCat = await Category.findOne({ slug: (activeCategoryId as string).toLowerCase().trim() }).select('_id');
        if (resolvedCat) {
          resolvedCatIds = [resolvedCat._id as mongoose.Types.ObjectId];
          // Find all subcategories (child categories) for this parent category
          const childCats = await Category.find({ parentId: resolvedCat._id }).select('_id');
          if (childCats.length > 0) {
            resolvedCatIds.push(...childCats.map(c => c._id as mongoose.Types.ObjectId));
          }
          const legacySubs = await SubCategory.find({ category: resolvedCat._id }).select('_id');
          if (legacySubs.length > 0) {
            resolvedCatIds.push(...legacySubs.map(s => s._id as mongoose.Types.ObjectId));
          }
        } else {
          const resolvedHeader = await HeaderCategory.findOne({ slug: (activeCategoryId as string).toLowerCase().trim() }).select('_id');
          if (resolvedHeader) {
            const categoriesInHeader = await Category.find({ headerCategoryId: resolvedHeader._id }).select('_id');
            const catIds = categoriesInHeader.map(c => c._id as mongoose.Types.ObjectId);
            resolvedCatIds = [...catIds];
            
            // Also find children of these categories
            if (catIds.length > 0) {
              const childCats = await Category.find({ parentId: { $in: catIds } }).select('_id');
              if (childCats.length > 0) {
                resolvedCatIds.push(...childCats.map(c => c._id as mongoose.Types.ObjectId));
              }
              const legacySubs = await SubCategory.find({ category: { $in: catIds } }).select('_id');
              if (legacySubs.length > 0) {
                resolvedCatIds.push(...legacySubs.map(s => s._id as mongoose.Types.ObjectId));
              }
            }
          }
        }
      }

      if (resolvedCatIds.length > 0) {
        andConditions.push({
          $or: [
            { category: { $in: resolvedCatIds } },
            { categoryId: { $in: resolvedCatIds } },
            { subcategory: { $in: resolvedCatIds } },
            { subcategoryId: { $in: resolvedCatIds } },
            { subCategoryId: { $in: resolvedCatIds } }
          ]
        });
      }
    }

    // Handle subcategory filtering with robust ObjectId/Slug resolution
    if (subcategoryParam) {
      let resolvedSubId: mongoose.Types.ObjectId | null = null;
      if (mongoose.Types.ObjectId.isValid(subcategoryParam as string)) {
        resolvedSubId = new mongoose.Types.ObjectId(subcategoryParam as string);
      } else {
        const slugStr = (subcategoryParam as string).toLowerCase().trim();
        // Try finding in SubCategory first
        const resolvedSub = await SubCategory.findOne({ slug: slugStr }).select('_id');
        if (resolvedSub) {
          resolvedSubId = resolvedSub._id as mongoose.Types.ObjectId;
        } else {
          // Try finding in Category (hierarchical subcategory)
          const resolvedCatSub = await Category.findOne({ slug: slugStr, parentId: { $ne: null } }).select('_id');
          if (resolvedCatSub) {
            resolvedSubId = resolvedCatSub._id as mongoose.Types.ObjectId;
          }
        }
      }

      if (resolvedSubId) {
        andConditions.push({
          $or: [
            { subcategory: resolvedSubId },
            { subCategoryId: resolvedSubId }
          ]
        });
      }
    }

    if (andConditions.length > 0) {
      baseQuery.$and = andConditions;
    }

    // Support text-based search with regex for better partial matches and single-character searches
    if (search && String(search).trim()) {
      const searchStr = String(search).trim();
      const searchRegex = new RegExp(searchStr, "i");
      
      andConditions.push({
        $or: [
          { productName: { $regex: searchRegex } },
          { smallDescription: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
          { tags: { $regex: searchRegex } },
          { brandName: { $regex: searchRegex } },
          { sku: { $regex: searchRegex } },
          { barcode: { $regex: searchRegex } },
          { pack: { $regex: searchRegex } }
        ]
      });
    }

    let sort: any = { createdAt: -1 };
    const activeSort = sortBy || sortParam;
    if (activeSort === 'lowestPrice' || activeSort === 'price_asc' || activeSort === 'priceAsc') {
      sort = { finalPrice: 1 };
    } else if (activeSort === 'highestPrice' || activeSort === 'price_desc' || activeSort === 'priceDesc') {
      sort = { finalPrice: -1 };
    } else if (activeSort === 'newest') {
      sort = { createdAt: -1 };
    } else if (search && String(search).trim()) {
      sort = { createdAt: -1 };
    }

    // ── Fetch Quick (location-based) products ───────────────────────────────
    let quickProducts: any[] = [];
    if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
      const nearbySellerIds = await findSellersWithinRange(userLat, userLng);
      if (nearbySellerIds.length > 0) {
        const quickQuery = {
          ...baseQuery,
          type: { $in: ['quick', 'both'] },
          seller: { $in: nearbySellerIds },
        };
        quickProducts = await Product.find(quickQuery)
          .populate('category', 'name')
          .populate('categoryId', 'name')
          .populate('subcategory', 'name')
          .populate('subCategoryId', 'name')
          .populate('seller', 'storeName location serviceRadiusKm city')
          .populate('sellerId', 'storeName location serviceRadiusKm city')
          .sort(sort)
          .limit(limitNum)
          .skip(skip)
          .lean();
      }
    } else if (userCityParam) {
      // City-based fallback for quick delivery
      const normalizedCity = normalizeCity(userCityParam as string);
      const sellersInCity = await Seller.find({ city: normalizedCity, status: 'Approved' }).select('_id');
      const sellerIds = sellersInCity.map(s => s._id);
      
      const quickQuery = {
        ...baseQuery,
        type: { $in: ['quick', 'both'] }, // Laxmart shows all quick-eligible products
        seller: { $in: sellerIds }
      };
      
      quickProducts = await Product.find(quickQuery)
        .populate('category', 'name')
        .populate('categoryId', 'name')
        .populate('subcategory', 'name')
        .populate('subCategoryId', 'name')
        .populate('seller', 'storeName location serviceRadiusKm city')
        .populate('sellerId', 'storeName location serviceRadiusKm city')
        .sort(sort)
        .limit(limitNum)
        .skip(skip)
        .lean();
    }

    // ── Fetch Ecommerce (pincode-based) products ────────────────────────────
    // Fetch pincode-specific products when user pincode is available, or All India products if pincode was passed
    let ecommerceProducts: any[] = [];
    if (userPincode) {
      const universalPincodeConditions: any[] = [
        { availablePincodes: userPincode },
        { availablePincodes: "*" },
        { availablePincodes: "all" },
        { availablePincodes: "national" },
        { availablePincodes: { $regex: /^(all|national|india|any|global|unrestricted|every|world)/i } }
      ];

      const ecomQuery = {
        ...baseQuery,
        type: { $in: ['ecommerce', 'both'] },
        $or: universalPincodeConditions
      };

      ecommerceProducts = await Product.find(ecomQuery)
        .populate('category', 'name')
        .populate('categoryId', 'name')
        .populate('subcategory', 'name')
        .populate('subCategoryId', 'name')
        .populate('seller', 'storeName location serviceRadiusKm')
        .populate('sellerId', 'storeName location serviceRadiusKm')
        .sort(sort)
        .limit(limitNum)
        .skip(skip)
        .lean();
    }

    // ── If no location and no pincode given, fall back to all active products ───────
    let fallbackProducts: any[] = [];
    if (!userLat && !userPincode && !userCityParam) {
      fallbackProducts = await Product.find(baseQuery)
        .populate('category', 'name')
        .populate('categoryId', 'name')
        .populate('subcategory', 'name')
        .populate('subCategoryId', 'name')
        .populate('seller', 'storeName')
        .populate('sellerId', 'storeName')
        .sort(sort)
        .limit(limitNum)
        .skip(skip)
        .lean();
    }

    // ── Merge and deduplicate by _id ─────────────────────────────────────────
    let allRaw = [...quickProducts, ...ecommerceProducts, ...fallbackProducts];

    // Note: If user provided latitude/longitude or pincode, strictly respect the radius/pincode filter!
    // Do NOT fall back to showing all sellers when the customer is outside the seller's service radius.

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
        const seller = product.seller as any;
        const sellerCity = seller?.city ? normalizeCity(seller.city) : '';
        const userCity = userCityParam ? normalizeCity(userCityParam as string) : '';
        
        let distance = null;
        if (userLat && userLng && seller?.location?.coordinates) {
          distance = calculateDistance(
            userLat, 
            userLng, 
            seller.location.coordinates[1], // lat
            seller.location.coordinates[0]  // lng
          );
        }

        const sellerRadius =
          typeof seller?.serviceRadiusKm === "number" && seller.serviceRadiusKm > 0
            ? seller.serviceRadiusKm
            : 10;
        const isWithinRadius =
          userLat !== null && userLng !== null && distance !== null
            ? distance <= sellerRadius
            : false;

        let resolvedDeliveryType = "e-comm";
        let resolvedDeliveryLabel = "E-comm";
        let resolvedDeliveryTime = "3-5 days";

        const pType = product.type || product.deliveryType;
        if (pType === "quick") {
          if (isWithinRadius || (!userLat && sellerCity && userCity && sellerCity === userCity)) {
            resolvedDeliveryType = "quick";
            resolvedDeliveryLabel = "Quick Delivery";
            resolvedDeliveryTime = "30-45 min";
          } else {
            resolvedDeliveryType = "e-comm";
            resolvedDeliveryLabel = "E-comm";
            resolvedDeliveryTime = "3-5 days";
          }
        } else if (pType === "ecommerce" || pType === "e-comm") {
          resolvedDeliveryType = "e-comm";
          resolvedDeliveryLabel = "E-comm";
          resolvedDeliveryTime = "3-5 days";
        } else if (pType === "both") {
          const isNearby =
            isWithinRadius || (!userLat && sellerCity && userCity && sellerCity === userCity);
          if (isNearby) {
            resolvedDeliveryType = "quick";
            resolvedDeliveryLabel = "Quick Delivery";
            resolvedDeliveryTime = "30-45 min";
          } else {
            resolvedDeliveryType = "e-comm";
            resolvedDeliveryLabel = "E-comm";
            resolvedDeliveryTime = "3-5 days";
          }
        }

        return {
          productId: product._id,
          ...product,
          distance,
          nearbyAvailable: resolvedDeliveryType === 'quick',
          ecommerceAvailable,
          quickDeliveryAvailable: resolvedDeliveryType === 'quick',
          isSameCity: sellerCity === userCity,
          deliveryType: resolvedDeliveryType,
          deliveryLabel: resolvedDeliveryLabel,
          quickPrice: product.discPrice || product.price,
          ecommercePrice: product.discPrice || product.price,
          deliveryTimeQuick: resolvedDeliveryTime,
          deliveryTimeEcommerce: '3-5 days',
        };
      });

    // Manually populate subcategories to support both Category & SubCategory models
    const populatedHybridProducts = await populateProductsSubcategory(hybridProducts);

    return res.status(200).json({ success: true, data: populatedHybridProducts });

  } catch (error: any) {
    console.error('[getProducts] Decision Engine ERROR:', error.message);
    return res.status(500).json({ success: false, message: 'Error fetching products', error: error.message });
  }
};

// Get single product by ID (public)
export const getProductById = async (req: Request, res: Response) => {
  console.log('[getProductById] Called with ID:', req.params.id);
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
      .populate("categoryId", "name")
      .populate("subcategory", "name")
      .populate("subCategoryId", "name")
      .populate("brand", "name")
      .populate(
        "seller",
        "storeName mobile city fssaiLicNo address location serviceRadiusKm status"
      )
      .populate(
        "sellerId",
        "storeName mobile city fssaiLicNo address location serviceRadiusKm status"
      );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or unavailable' });
    }
    const seller = product.seller as any;
    if (seller && seller.city) {
      seller.city = normalizeCity(seller.city);
    }

    if (!product || (product.seller as any)?.status !== "Approved") {
      return res.status(404).json({
        success: false,
        message: "Product not found or unavailable",
      });
    }

    const userLat = req.query.latitude ? parseFloat(req.query.latitude as string) : (req.query.lat ? parseFloat(req.query.lat as string) : null);
    const userLng = req.query.longitude ? parseFloat(req.query.longitude as string) : (req.query.lng ? parseFloat(req.query.lng as string) : null);

    let isAvailableAtLocation = true;
    let distanceKm: number | null = null;
    const sellerRadius = (typeof seller?.serviceRadiusKm === 'number' && seller.serviceRadiusKm > 0)
      ? seller.serviceRadiusKm
      : 10;

    if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng) && seller) {
      let sLat: number | null = null;
      let sLng: number | null = null;

      if (
        seller.location?.coordinates &&
        Array.isArray(seller.location.coordinates) &&
        seller.location.coordinates.length === 2 &&
        (seller.location.coordinates[0] !== 0 || seller.location.coordinates[1] !== 0)
      ) {
        sLng = Number(seller.location.coordinates[0]);
        sLat = Number(seller.location.coordinates[1]);
      } else if (seller.latitude && seller.longitude) {
        const parsedLat = parseFloat(seller.latitude);
        const parsedLng = parseFloat(seller.longitude);
        if (!isNaN(parsedLat) && !isNaN(parsedLng) && (parsedLat !== 0 || parsedLng !== 0)) {
          sLat = parsedLat;
          sLng = parsedLng;
        }
      }

      if (sLat !== null && sLng !== null) {
        distanceKm = calculateDistance(userLat, userLng, sLat, sLng);
        if (product.type === 'quick' || product.deliveryType === 'quick') {
          isAvailableAtLocation = distanceKm <= sellerRadius;
        }
      }
    }

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

    const productObj = product.toObject();
    const similarProductsObj = similarProducts.map(p => p.toObject());
    
    // Populate subcategories manually
    await populateProductsSubcategory([productObj]);
    await populateProductsSubcategory(similarProductsObj);

    return res.status(200).json({
      success: true,
      data: {
        ...productObj,
        similarProducts: similarProductsObj,
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

/**
 * Get only Quick Commerce products (for Quick section)
 */
export const getQuickProducts = async (req: Request, res: Response) => {
  console.log('[getQuickProducts] Called with query:', req.query);
  try {
    const {
      categoryId,
      category: categoryParam,
      subcategory: subcategoryParam,
      headerCategory,
      city: userCityParam,
      lat,
      lng,
      latitude,
      longitude,
      search,
      limit = 20,
      page = 1,
      sortBy,
      sort: sortParam
    } = req.query;

    const limitNum = Number(limit);
    const skip = (Number(page) - 1) * limitNum;

    // Base query for active approved products (strictly quick products inside Quick module)
    const query: any = { 
      status: 'Active', 
      publish: true,
      $or: [
        { type: { $in: ['quick', 'both'] } },
        { deliveryType: { $in: ['quick', 'both'] } }
      ]
    };

    // Filter by Header Category (e.g. from top tabs)
    if (headerCategory) {
      const headerQueryArray = [];
      if (mongoose.Types.ObjectId.isValid(headerCategory as string)) {
        headerQueryArray.push({ _id: new mongoose.Types.ObjectId(headerCategory as string) });
      } else {
        headerQueryArray.push({ slug: (headerCategory as string).toLowerCase().trim() });
      }

      const headerCategoryDoc = await HeaderCategory.findOne({ $or: headerQueryArray }).select('_id');

      if (headerCategoryDoc) {
        // Find all categories under this header category for maximum compatibility
        const categoriesInHeader = await Category.find({ 
          headerCategoryId: headerCategoryDoc._id,
          status: "Active" 
        }).select('_id');
        const categoryIds = categoriesInHeader.map(c => c._id);

        query.$or = [
          { headerCategoryId: headerCategoryDoc._id },
          { category: { $in: categoryIds } }
        ];
      }
    }

    const quickAndConditions: any[] = [];

    // Category / Subcategory with robust Slug/ObjectId resolution
    const activeCategoryId = categoryId || categoryParam;
    if (activeCategoryId) {
      let resolvedCatIds: mongoose.Types.ObjectId[] = [];
      if (mongoose.Types.ObjectId.isValid(activeCategoryId as string)) {
        const objectId = new mongoose.Types.ObjectId(activeCategoryId as string);
        const headerCat = await HeaderCategory.findById(objectId).select('_id');
        
        if (headerCat) {
          // It's a HeaderCategory ID! Find all child Categories.
          const categoriesInHeader = await Category.find({ headerCategoryId: headerCat._id }).select('_id');
          const catIds = categoriesInHeader.map(c => c._id as mongoose.Types.ObjectId);
          resolvedCatIds = [...catIds];
          
          if (catIds.length > 0) {
            const childCats = await Category.find({ parentId: { $in: catIds } }).select('_id');
            if (childCats.length > 0) {
              resolvedCatIds.push(...childCats.map(c => c._id as mongoose.Types.ObjectId));
            }
            const legacySubs = await SubCategory.find({ category: { $in: catIds } }).select('_id');
            if (legacySubs.length > 0) {
              resolvedCatIds.push(...legacySubs.map(s => s._id as mongoose.Types.ObjectId));
            }
          }
        } else {
          // Standard Category ID
          resolvedCatIds = [objectId];
          const childCats = await Category.find({ parentId: objectId }).select('_id');
          if (childCats.length > 0) {
            resolvedCatIds.push(...childCats.map(c => c._id as mongoose.Types.ObjectId));
          }
          const legacySubs = await SubCategory.find({ category: objectId }).select('_id');
          if (legacySubs.length > 0) {
            resolvedCatIds.push(...legacySubs.map(s => s._id as mongoose.Types.ObjectId));
          }
        }
      } else {
        const resolvedCat = await Category.findOne({ slug: (activeCategoryId as string).toLowerCase().trim() }).select('_id');
        if (resolvedCat) {
          resolvedCatIds = [resolvedCat._id as mongoose.Types.ObjectId];
          // Find all subcategories (child categories) for this parent category
          const childCats = await Category.find({ parentId: resolvedCat._id }).select('_id');
          if (childCats.length > 0) {
            resolvedCatIds.push(...childCats.map(c => c._id as mongoose.Types.ObjectId));
          }
          const legacySubs = await SubCategory.find({ category: resolvedCat._id }).select('_id');
          if (legacySubs.length > 0) {
            resolvedCatIds.push(...legacySubs.map(s => s._id as mongoose.Types.ObjectId));
          }
        } else {
          const resolvedHeader = await HeaderCategory.findOne({ slug: (activeCategoryId as string).toLowerCase().trim() }).select('_id');
          if (resolvedHeader) {
            const categoriesInHeader = await Category.find({ headerCategoryId: resolvedHeader._id }).select('_id');
            const catIds = categoriesInHeader.map(c => c._id as mongoose.Types.ObjectId);
            resolvedCatIds = [...catIds];
            
            // Also find children of these categories
            if (catIds.length > 0) {
              const childCats = await Category.find({ parentId: { $in: catIds } }).select('_id');
              if (childCats.length > 0) {
                resolvedCatIds.push(...childCats.map(c => c._id as mongoose.Types.ObjectId));
              }
              const legacySubs = await SubCategory.find({ category: { $in: catIds } }).select('_id');
              if (legacySubs.length > 0) {
                resolvedCatIds.push(...legacySubs.map(s => s._id as mongoose.Types.ObjectId));
              }
            }
          }
        }
      }

      if (resolvedCatIds.length > 0) {
        quickAndConditions.push({
          $or: [
            { category: { $in: resolvedCatIds } },
            { categoryId: { $in: resolvedCatIds } },
            { subcategory: { $in: resolvedCatIds } },
            { subcategoryId: { $in: resolvedCatIds } },
            { subCategoryId: { $in: resolvedCatIds } }
          ]
        });
      }
    }
    
    if (subcategoryParam) {
      let resolvedSubId: mongoose.Types.ObjectId | null = null;
      if (mongoose.Types.ObjectId.isValid(subcategoryParam as string)) {
        resolvedSubId = new mongoose.Types.ObjectId(subcategoryParam as string);
      } else {
        const slugStr = (subcategoryParam as string).toLowerCase().trim();
        const resolvedSub = await SubCategory.findOne({ slug: slugStr }).select('_id');
        if (resolvedSub) {
          resolvedSubId = resolvedSub._id as mongoose.Types.ObjectId;
        } else {
          const resolvedCatSub = await Category.findOne({ slug: slugStr, parentId: { $ne: null } }).select('_id');
          if (resolvedCatSub) {
            resolvedSubId = resolvedCatSub._id as mongoose.Types.ObjectId;
          }
        }
      }

      if (resolvedSubId) {
        quickAndConditions.push({
          $or: [
            { subcategory: resolvedSubId },
            { subCategoryId: resolvedSubId }
          ]
        });
      }
    }

    if (quickAndConditions.length > 0) {
      query.$and = quickAndConditions;
    }

    // Support text-based search with regex for better partial matches and single-character searches
    if (search && String(search).trim()) {
      const searchStr = String(search).trim();
      const searchRegex = new RegExp(searchStr, "i");
      
      quickAndConditions.push({
        $or: [
          { productName: { $regex: searchRegex } },
          { smallDescription: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
          { tags: { $regex: searchRegex } },
          { brandName: { $regex: searchRegex } },
          { sku: { $regex: searchRegex } },
          { barcode: { $regex: searchRegex } },
          { pack: { $regex: searchRegex } }
        ]
      });
    }

    // Filter by coordinates within seller service radius, or by city, or fallback to all approved sellers
    const userLat = (latitude || lat) ? Number(latitude || lat) : null;
    const userLng = (longitude || lng) ? Number(longitude || lng) : null;
    const rawCity = userCityParam as string;
    const userCity = (rawCity && rawCity !== 'undefined' && rawCity !== 'null') ? normalizeCity(rawCity) : "";

    if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
      const nearbySellerIds = await findSellersWithinRange(userLat, userLng);
      // Strictly restrict to sellers whose service radius covers the customer's location
      query.seller = { $in: nearbySellerIds };
      console.log(`[getQuickProducts] Filtered by seller service radius for coords [${userLat}, ${userLng}]. Found ${nearbySellerIds.length} sellers in range.`);
    } else if (userCity) {
      const sellersInCity = await Seller.find({ 
        city: { $regex: new RegExp(`^${userCity}$`, 'i') }, 
        status: 'Approved' 
      }).select('_id');
      
      const sellerIds = sellersInCity.map(s => s._id);
      query.seller = { $in: sellerIds };
      console.log(`[getQuickProducts] Restricting to sellers in user city "${userCity}":`, sellerIds);
    } else {
      // If neither location nor city is provided, fallback to all approved sellers
      const approvedSellers = await Seller.find({ status: 'Approved' }).select('_id');
      query.seller = { $in: approvedSellers.map(s => s._id) };
    }

    let sort: any = { createdAt: -1 };
    const activeSort = sortBy || sortParam;
    if (activeSort === 'lowestPrice' || activeSort === 'price_asc' || activeSort === 'priceAsc') {
      sort = { finalPrice: 1 };
    } else if (activeSort === 'highestPrice' || activeSort === 'price_desc' || activeSort === 'priceDesc') {
      sort = { finalPrice: -1 };
    } else if (activeSort === 'newest') {
      sort = { createdAt: -1 };
    } else if (search && String(search).trim()) {
      sort = { createdAt: -1 };
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')
        .populate('categoryId', 'name')
        .populate('subcategory', 'name')
        .populate('subCategoryId', 'name')
        .populate('seller', 'storeName location city status')
        .populate('sellerId', 'storeName location city status')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    // Format products consistent with getProducts mapping
    const formattedProducts = products.map((product: any) => {
      const seller = product.seller as any;
      const sellerCity = seller?.city ? normalizeCity(seller.city) : '';
      const userCityNormalized = userCityParam ? normalizeCity(userCityParam as string) : '';
      const isSameCity = sellerCity && userCityNormalized ? sellerCity.toLowerCase() === userCityNormalized.toLowerCase() : false;

      // Debug logging requested by the user
      console.log('[getQuickProducts Debug]', {
        productName: product.productName || product.name,
        userCity: userCityNormalized,
        sellerCity,
        isQuickEligible: product.isQuickEligible,
        type: product.type,
        isSameCity
      });

      let resolvedDeliveryType = 'quick';
      let resolvedDeliveryLabel = 'Quick Delivery';
      const pType = product.type || product.deliveryType;
      
      if (pType === 'ecommerce' || pType === 'e-comm') {
        resolvedDeliveryType = 'e-comm';
        resolvedDeliveryLabel = 'E-comm';
      } else if (pType === 'quick') {
        resolvedDeliveryType = 'quick';
        resolvedDeliveryLabel = 'Quick Delivery';
      } else if (pType === 'both') {
        resolvedDeliveryType = 'quick'; // In quick section, prioritize quick
        resolvedDeliveryLabel = 'Quick Delivery';
      }

      return {
        productId: product._id,
        ...product,
        nearbyAvailable: true,
        ecommerceAvailable: product.type === 'both',
        quickDeliveryAvailable: true,
        isSameCity,
        deliveryType: resolvedDeliveryType,
        deliveryLabel: resolvedDeliveryLabel,
        quickPrice: product.discPrice || product.price,
        ecommercePrice: product.discPrice || product.price,
        deliveryTimeQuick: '30-45 min',
        deliveryTimeEcommerce: '3-5 days',
      };
    });

    // Prioritize products from same city at the top of the feed
    formattedProducts.sort((a, b) => {
      if (a.isSameCity && !b.isSameCity) return -1;
      if (!a.isSameCity && b.isSameCity) return 1;
      return 0;
    });

    // Manually populate subcategories to support both Category & SubCategory models
    const populatedFormattedProducts = await populateProductsSubcategory(formattedProducts);

    return res.status(200).json({
      success: true,
      message: "Quick products retrieved successfully",
      data: populatedFormattedProducts,
      pagination: {
        page: Number(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error: any) {
    console.error('[getQuickProducts] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Error fetching quick products', error: error.message });
  }
};

