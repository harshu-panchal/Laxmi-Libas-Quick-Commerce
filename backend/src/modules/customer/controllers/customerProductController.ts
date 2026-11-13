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

const escapeRegex = (str: string) => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

/**
 * Builds a comprehensive search condition matching exact name, SKU, barcode, tags, brand,
 * category names, attributes, and multi-word token combinations.
 */
const buildSearchCondition = async (searchStr: string) => {
  const trimmed = searchStr.trim();
  if (!trimmed) return null;

  const escaped = escapeRegex(trimmed);
  const phraseRegex = new RegExp(escaped, 'i');

  // Also check if any Category matches this search term (e.g. "Saree", "Uniform", "Footwear")
  const matchingCategories = await Category.find({
    name: { $regex: phraseRegex }
  }).select('_id').lean();
  const matchedCatIds = matchingCategories.map(c => c._id);

  // Split words for multi-word search (e.g. "dav shirt" or "blue saree")
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  
  const searchOrConditions: any[] = [
    { productName: { $regex: phraseRegex } },
    { smallDescription: { $regex: phraseRegex } },
    { description: { $regex: phraseRegex } },
    { tags: { $regex: phraseRegex } },
    { brandName: { $regex: phraseRegex } },
    { sku: { $regex: phraseRegex } },
    { barcode: { $regex: phraseRegex } },
    { pack: { $regex: phraseRegex } },
    { color: { $regex: phraseRegex } },
    { fabric: { $regex: phraseRegex } },
    { material: { $regex: phraseRegex } }
  ];

  if (matchedCatIds.length > 0) {
    searchOrConditions.push({ category: { $in: matchedCatIds } });
    searchOrConditions.push({ categoryId: { $in: matchedCatIds } });
    searchOrConditions.push({ subcategory: { $in: matchedCatIds } });
    searchOrConditions.push({ subCategoryId: { $in: matchedCatIds } });
  }

  // If multiple words, also match where all words appear
  if (words.length > 1) {
    const wordAndCondition = {
      $and: words.map(w => {
        const wRegex = new RegExp(escapeRegex(w), 'i');
        return {
          $or: [
            { productName: { $regex: wRegex } },
            { smallDescription: { $regex: wRegex } },
            { description: { $regex: wRegex } },
            { tags: { $regex: wRegex } },
            { brandName: { $regex: wRegex } },
            { color: { $regex: wRegex } },
            { fabric: { $regex: wRegex } },
            { material: { $regex: wRegex } }
          ]
        };
      })
    };
    searchOrConditions.push(wordAndCondition);
  }

  return { $or: searchOrConditions };
};

/**
 * Score and sort products by relevance so exact product matches are ALWAYS first!
 */
const rankProductsByRelevance = (products: any[], searchStr: string) => {
  if (!searchStr || !products || products.length === 0) return products;
  const query = searchStr.trim().toLowerCase();
  const escapedQuery = escapeRegex(query);
  const wordBoundaryRegex = new RegExp(`\\b${escapedQuery}\\b`, 'i');
  const startsWithRegex = new RegExp(`^${escapedQuery}`, 'i');
  const tokens = query.split(/\s+/).filter(Boolean);

  return [...products].sort((a, b) => {
    const nameA = (a.productName || a.name || '').toLowerCase();
    const nameB = (b.productName || b.name || '').toLowerCase();
    const skuA = (a.sku || '').toLowerCase();
    const skuB = (b.sku || '').toLowerCase();
    const barcodeA = (a.barcode || '').toLowerCase();
    const barcodeB = (b.barcode || '').toLowerCase();

    // 1. Exact match on Product Name (Score: 1000)
    const exactNameA = nameA === query ? 1000 : 0;
    const exactNameB = nameB === query ? 1000 : 0;
    if (exactNameA !== exactNameB) return exactNameB - exactNameA;

    // 2. Exact match on SKU or Barcode (Score: 900)
    const exactCodeA = (skuA === query || barcodeA === query) ? 900 : 0;
    const exactCodeB = (skuB === query || barcodeB === query) ? 900 : 0;
    if (exactCodeA !== exactCodeB) return exactCodeB - exactCodeA;

    // 3. Product Name starts with query (Score: 800)
    const startsA = startsWithRegex.test(nameA) ? 800 : 0;
    const startsB = startsWithRegex.test(nameB) ? 800 : 0;
    if (startsA !== startsB) return startsB - startsA;

    // 4. Exact word match in Product Name (Score: 700)
    const wordA = wordBoundaryRegex.test(nameA) ? 700 : 0;
    const wordB = wordBoundaryRegex.test(nameB) ? 700 : 0;
    if (wordA !== wordB) return wordB - wordA;

    // 5. Contains full query in Product Name (Score: 600)
    const containsA = nameA.includes(query) ? 600 : 0;
    const containsB = nameB.includes(query) ? 600 : 0;
    if (containsA !== containsB) return containsB - containsA;

    // 6. Contains all query tokens in Product Name (Score: 500)
    if (tokens.length > 1) {
      const allTokensA = tokens.every(t => nameA.includes(t)) ? 500 : 0;
      const allTokensB = tokens.every(t => nameB.includes(t)) ? 500 : 0;
      if (allTokensA !== allTokensB) return allTokensB - allTokensA;
    }

    // 7. Brand / Tag match
    const brandA = (a.brandName || '').toLowerCase().includes(query) ? 300 : 0;
    const brandB = (b.brandName || '').toLowerCase().includes(query) ? 300 : 0;
    if (brandA !== brandB) return brandB - brandA;

    return 0;
  });
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

    // Support text-based search with regex for better partial matches and single-character searches
    if (search && String(search).trim()) {
      const searchCondition = await buildSearchCondition(String(search).trim());
      if (searchCondition) {
        andConditions.push(searchCondition);
      }
    }

    if (andConditions.length > 0) {
      baseQuery.$and = andConditions;
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

    // ── Fetch Ecommerce products ────────────────────────────
    let ecommerceProducts: any[] = [];
    const universalPincodeConditions: any[] = [
      { availablePincodes: "*" },
      { availablePincodes: "all" },
      { availablePincodes: "national" },
      { availablePincodes: { $regex: /^(all|national|india|any|global|unrestricted|every|world)/i } }
    ];
    if (userPincode) {
      universalPincodeConditions.push({ availablePincodes: userPincode });
    }

    const ecomQuery: any = {
      ...baseQuery,
      type: { $in: ['ecommerce', 'both'] },
    };
    if (userPincode) {
      ecomQuery.$or = universalPincodeConditions;
    }

    ecommerceProducts = await Product.find(ecomQuery)
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

    // ── If no location and no pincode given, fall back to all active products ───────
    let fallbackProducts: any[] = [];
    if (!userLat && !userPincode && !userCityParam) {
      fallbackProducts = await Product.find(baseQuery)
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

    // ── Merge and deduplicate by _id ─────────────────────────────────────────
    let allRaw = [...quickProducts, ...ecommerceProducts, ...fallbackProducts];

    // When searching, if location/pincode filtering yielded 0 products, search across all products matching baseQuery
    if (search && String(search).trim() && allRaw.length === 0) {
      const searchFallback = await Product.find(baseQuery)
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
      allRaw.push(...searchFallback);
    }

    const seen = new Set<string>();
    const hybridProducts = allRaw
      .filter((p: any) => {
        const id = p._id.toString();
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((product: any) => {
        const seller = product.seller as any;
        const sellerCity = seller?.city ? normalizeCity(seller.city) : '';
        const userCity = userCityParam ? normalizeCity(userCityParam as string) : '';
        
        let distance = null;
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
            distance = calculateDistance(userLat, userLng, sLat, sLng);
          }
        }

        const sellerRadius =
          typeof seller?.serviceRadiusKm === "number" && seller.serviceRadiusKm > 0
            ? seller.serviceRadiusKm
            : 10;
        const isWithinRadius =
          userLat !== null && userLng !== null && distance !== null
            ? distance <= sellerRadius
            : false;

        const isNearby =
          isWithinRadius || (!userLat && sellerCity && userCity && sellerCity === userCity);

        const pType: string = (product.type || (product as any).deliveryType || "") as string;
        let resolvedDeliveryType = "e-comm";
        let resolvedDeliveryLabel = "E-comm";
        let resolvedDeliveryTime = "3-5 days";

        if (isNearby) {
          if (pType === "quick" || pType === "both") {
            resolvedDeliveryType = "quick";
            resolvedDeliveryLabel = "Quick Delivery";
            resolvedDeliveryTime = "20-30 min";
          } else {
            resolvedDeliveryType = "e-comm";
            resolvedDeliveryLabel = "E-comm";
            resolvedDeliveryTime = "3-5 days";
          }
        } else {
          // Seller is OUTSIDE customer service radius!
          // NEVER mark as quick delivery, always route to e-comm
          resolvedDeliveryType = "e-comm";
          resolvedDeliveryLabel = "E-comm";
          resolvedDeliveryTime = "3-5 days";
        }

        const quickAvailable = isNearby && (pType === "quick" || pType === "both");
        const ecommerceAvailable = pType === "both" || pType === "ecommerce" || pType === "e-comm";

        return {
          productId: product._id,
          ...product,
          distance,
          nearbyAvailable: quickAvailable,
          ecommerceAvailable,
          quickDeliveryAvailable: quickAvailable,
          isSameCity: sellerCity === userCity,
          deliveryType: resolvedDeliveryType,
          deliveryLabel: resolvedDeliveryLabel,
          deliveryTime: resolvedDeliveryTime,
          quickPrice: product.discPrice || product.price,
          ecommercePrice: product.discPrice || product.price,
          deliveryTimeQuick: resolvedDeliveryTime,
          deliveryTimeEcommerce: '3-5 days',
        };
      });

    // Manually populate subcategories to support both Category & SubCategory models
    let populatedHybridProducts = await populateProductsSubcategory(hybridProducts);

    if (search && String(search).trim()) {
      populatedHybridProducts = rankProductsByRelevance(populatedHybridProducts, String(search).trim());
    }

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
      }
    }

    const userCity = req.query.city ? normalizeCity(req.query.city as string) : '';
    const sellerCity = seller?.city ? normalizeCity(seller.city) : '';
    const isWithinRadius = (userLat !== null && userLng !== null && distanceKm !== null)
      ? distanceKm <= sellerRadius
      : false;
    const isNearby = isWithinRadius || (!userLat && sellerCity && userCity && sellerCity === userCity);

    let resolvedDeliveryType = "e-comm";
    let quickDeliveryAvailable = false;
    const pType: string = (product.type || (product as any).deliveryType || "") as string;

    if (isNearby) {
      if (pType === "quick" || pType === "both") {
        resolvedDeliveryType = "quick";
        quickDeliveryAvailable = true;
        isAvailableAtLocation = true;
      } else {
        resolvedDeliveryType = "e-comm";
        quickDeliveryAvailable = false;
        isAvailableAtLocation = true;
      }
    } else {
      // Out of range!
      if (pType === "both" || pType === "ecommerce" || pType === "e-comm") {
        resolvedDeliveryType = "e-comm";
        quickDeliveryAvailable = false;
        isAvailableAtLocation = true;
      } else {
        // Pure quick commerce product, seller is far away
        resolvedDeliveryType = "e-comm";
        quickDeliveryAvailable = false;
        isAvailableAtLocation = false;
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
        deliveryType: resolvedDeliveryType,
        quickDeliveryAvailable,
        nearbyAvailable: quickDeliveryAvailable,
        ecommerceAvailable: pType === "both" || pType === "ecommerce" || pType === "e-comm",
        distance: distanceKm,
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

    // Support text-based search with regex for better partial matches and single-character searches
    if (search && String(search).trim()) {
      const searchCondition = await buildSearchCondition(String(search).trim());
      if (searchCondition) {
        quickAndConditions.push(searchCondition);
      }
    }

    if (quickAndConditions.length > 0) {
      query.$and = quickAndConditions;
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

    let [products, total] = await Promise.all([
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

    // If searching in quick and no products found with location constraints, try without seller location constraint
    if (search && String(search).trim() && products.length === 0) {
      const fallbackQuery = { ...query };
      delete fallbackQuery.seller;
      const fallbackProducts = await Product.find(fallbackQuery)
        .populate('category', 'name')
        .populate('categoryId', 'name')
        .populate('subcategory', 'name')
        .populate('subCategoryId', 'name')
        .populate('seller', 'storeName location city status')
        .populate('sellerId', 'storeName location city status')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean();
      products = fallbackProducts;
      total = fallbackProducts.length;
    }

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
    let populatedFormattedProducts = await populateProductsSubcategory(formattedProducts);

    if (search && String(search).trim()) {
      populatedFormattedProducts = rankProductsByRelevance(populatedFormattedProducts, String(search).trim());
    }

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

