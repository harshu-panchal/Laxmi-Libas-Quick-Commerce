import { Request, Response } from "express";
import Product from "../../../models/Product";
import Shop from "../../../models/Shop";
import { asyncHandler } from "../../../utils/asyncHandler";

/**
 * Create a new product
 */
export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const productData = req.body;

    // Ensure sellerId matches authenticated seller
    if (productData.sellerId && productData.sellerId !== sellerId) {
      return res.status(403).json({
        success: false,
        message: "You can only create products for your own account",
      });
    }

    // 2. Map fields to match Product model
    const newProductData: any = {
      ...productData,
      seller: sellerId, // Map sellerId to seller
      headerCategoryId: productData.headerCategoryId, // Map headerCategoryId
      category: productData.categoryId, // Map categoryId to category
      subcategory: productData.subcategoryId,
      brand: productData.brandId,
      mainImage: productData.mainImageUrl, // Map mainImageUrl to mainImage
      galleryImages: productData.galleryImageUrls,
      productVideoUrl: productData.productVideoUrl, // Map productVideoUrl
    };

    // Strict Category Validation: Ensure product category matches seller's assigned category
    const sellerCategoryId = (req as any).user.categoryId;
    if (!sellerCategoryId) {
      return res.status(403).json({
        success: false,
        message: "You do not have a category assigned. Please contact admin.",
      });
    }

    // Check for Super Seller Bypass (Phone: 9111966732)
    const Seller = require("../../../models/Seller").default;
    const seller = await Seller.findById(sellerId);
    const isSuperSeller = seller && seller.mobile === "9111966732";

    if (!isSuperSeller && newProductData.category && newProductData.category.toString() !== sellerCategoryId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only upload products for your assigned category",
      });
    }

    // Force the category to be the one from the seller's JWT to prevent bypass, UNLESS it's the super seller
    if (!isSuperSeller) {
      newProductData.category = sellerCategoryId;
    }

    // Auto-populate headerCategoryId from Category if missing
    if (!newProductData.headerCategoryId && newProductData.category) {
      try {
        const CategoryModel = require("../../../models/Category").default;
        const categoryDoc = await CategoryModel.findById(newProductData.category).select("headerCategoryId");
        if (categoryDoc && categoryDoc.headerCategoryId) {
          newProductData.headerCategoryId = categoryDoc.headerCategoryId;
          console.log(`[createProduct] Auto-assigned headerCategoryId: ${categoryDoc.headerCategoryId} from category: ${newProductData.category}`);
        }
      } catch (err) {
        console.error("[createProduct] Error fetching category for headerCategoryId:", err);
      }
    }

    // 3. Set Price and Stock
    newProductData.price = productData.price;
    newProductData.discPrice = productData.discPrice || 0;
    newProductData.stock = parseInt(productData.stock) || 0;

    // Handle any extra fields as dynamic attributes
    const knownFields = [
      "productName", "smallDescription", "description", "categoryId", "subcategoryId",
      "brandId", "price", "discPrice", "stock", "mainImageUrl", "galleryImageUrls",
      "productVideoUrl", "taxId", "isShopByStoreOnly", "shopId", "publish", "popular",
      "dealOfDay", "status", "manufacturer", "madeIn", "requiresApproval", "tags",
      "sellerId", "seller", "headerCategoryId", "category", "subcategory", "brand",
      "mainImage", "galleryImages", "variations", "variationType"
    ];

    const attributes: any = {};
    Object.keys(productData).forEach(key => {
      if (!knownFields.includes(key)) {
        attributes[key] = productData[key];
      }
    });
    newProductData.attributes = attributes;

    // 4. Validate Price
    if (newProductData.price === undefined || newProductData.price === null) {
      return res.status(400).json({
        success: false,
        message: "Product price is required",
      });
    }

    // 5. Clean up undefined fields
    if (!newProductData.headerCategoryId)
      delete newProductData.headerCategoryId;
    if (!newProductData.subcategory) delete newProductData.subcategory;
    if (!newProductData.brand) delete newProductData.brand;

    // Handle Tax: Frontend sends taxId, Model expects 'tax' (string) or something else?
    // Checking SellerAddProduct.tsx sending taxId -> formData.tax
    // Model Product.ts -> tax: { type: String }
    // Ideally we should store the Tax ID or Name. Since frontend sends ID, let's map it.
    if (productData.taxId) {
      newProductData.tax = productData.taxId;
    }

    // 6. Set product status - All products are published automatically without approval
    newProductData.publish = true;

    // 6. Set product status - All products are published automatically without approval
    newProductData.publish = true;
    newProductData.status = "Active";
    newProductData.requiresApproval = false;

    // Set default values for other required fields if not provided
    if (!newProductData.popular) newProductData.popular = false;
    if (!newProductData.dealOfDay) newProductData.dealOfDay = false;
    if (!newProductData.isReturnable) newProductData.isReturnable = false;
    if (!newProductData.rating) newProductData.rating = 0;
    if (!newProductData.reviewsCount) newProductData.reviewsCount = 0;
    if (!newProductData.discount) newProductData.discount = 0;
    if (!newProductData.tags) newProductData.tags = [];

    // Handle Shop by Store fields
    if (productData.isShopByStoreOnly !== undefined) {
      newProductData.isShopByStoreOnly = productData.isShopByStoreOnly === true || productData.isShopByStoreOnly === "true";
    }
    if (productData.shopId) {
      newProductData.shopId = productData.shopId;
    } else if (newProductData.isShopByStoreOnly) {
      // If shop by store only is true but no shopId provided, set to null
      newProductData.shopId = null;
    }

    const product = await Product.create(newProductData);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  }
);

/**
 * Get seller's products with filters
 */
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;
  const {
    search,
    category,
    status,
    stock,
    page = "1",
    limit = "10",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build query
  const query: any = { seller: sellerId };

  // Search filter
  if (search) {
    query.$or = [
      { productName: { $regex: search, $options: "i" } },
      { smallDescription: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search as string, "i")] } },
    ];
  }

  // Category filter
  if (category) {
    query.category = category;
  }

  // Status filter (publish, popular, dealOfDay)
  if (status) {
    if (status === "published") {
      query.publish = true;
    } else if (status === "unpublished") {
      query.publish = false;
    } else if (status === "popular") {
      query.popular = true;
    } else if (status === "dealOfDay") {
      query.dealOfDay = true;
    }
  }

  // Stock filter
  if (stock === "inStock") {
    query.stock = { $gt: 0 };
  } else if (stock === "outOfStock") {
    // Check for products where total stock is 0
    // This implies all variations are out of stock
    query.stock = 0;
  }

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Sort
  const sort: any = {};
  sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

  const products = await Product.find(query)
    .populate("category", "name")
    .populate("subcategory", "name")
    .populate("brand", "name")
    .populate("tax", "name rate")
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await Product.countDocuments(query);

  return res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    data: products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * Get product by ID
 */
export const getProductById = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;

    // Prevent reserved route names from being treated as product IDs
    const reservedRoutes = ["shops", "brands"];
    if (reservedRoutes.includes(id)) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = await Product.findOne({ _id: id, seller: sellerId })
      .populate("category", "name")
      .populate("subcategory", "subcategoryName")
      .populate("headerCategoryId", "name slug")
      .populate("brand", "name")
      .populate("tax", "name rate");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: product,
    });
  }
);

/**
 * Update product
 */
export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;
    const updateData = req.body;

    console.log("DEBUG updateProduct: sellerId from token:", sellerId);
    console.log("DEBUG updateProduct: productId:", id);

    // Remove sellerId from update data if present (cannot change owner)
    delete updateData.sellerId;

    // Map frontend field names to model field names (same as createProduct)
    if (updateData.headerCategoryId !== undefined) {
      // Allow null/empty to clear header category
      updateData.headerCategoryId = updateData.headerCategoryId || null;
    }
    if (updateData.categoryId) {
      updateData.category = updateData.categoryId;
      delete updateData.categoryId;
    }
    if (updateData.subcategoryId) {
      updateData.subcategory = updateData.subcategoryId;
      delete updateData.subcategoryId;
    }
    if (updateData.brandId) {
      updateData.brand = updateData.brandId;
      delete updateData.brandId;
    }
    if (updateData.taxId) {
      updateData.tax = updateData.taxId;
      delete updateData.taxId;
    }
    if (updateData.mainImageUrl) {
      updateData.mainImage = updateData.mainImageUrl;
      delete updateData.mainImageUrl;
    }
    if (updateData.galleryImageUrls) {
      updateData.galleryImages = updateData.galleryImageUrls;
      delete updateData.galleryImageUrls;
    }
    // productVideoUrl maps directly to itself (no rename needed)
    // but handle explicit clear
    if (updateData.productVideoUrl === null || updateData.productVideoUrl === "") {
      updateData.productVideoUrl = null;
    }

    // Strict Category Validation for updates
    const sellerCategoryId = (req as any).user.categoryId;

    // Check for Super Seller Bypass (Phone: 9111966732)
    const Seller = require("../../../models/Seller").default;
    const seller = await Seller.findById(sellerId);
    const isSuperSeller = seller && seller.mobile === "9111966732";

    if (!isSuperSeller && updateData.category && updateData.category.toString() !== sellerCategoryId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot change the product category to one outside your assignment",
      });
    }

    // Force the category if it was attempted to be changed or just to be safe, UNLESS it's the super seller
    if (updateData.category && !isSuperSeller) {
      updateData.category = sellerCategoryId;
    }

    // Auto-populate headerCategoryId from Category if missing or empty
    if (!updateData.headerCategoryId && (updateData.category || sellerCategoryId)) {
      try {
        const CategoryModel = require("../../../models/Category").default;
        const targetCatId = updateData.category || sellerCategoryId;
        const categoryDoc = await CategoryModel.findById(targetCatId).select("headerCategoryId");
        if (categoryDoc && categoryDoc.headerCategoryId) {
          updateData.headerCategoryId = categoryDoc.headerCategoryId;
          console.log(`[updateProduct] Auto-assigned headerCategoryId: ${categoryDoc.headerCategoryId} from category: ${targetCatId}`);
        }
      } catch (err) {
        console.error("[updateProduct] Error fetching category for headerCategoryId:", err);
      }
    }

    // Handle any extra fields as dynamic attributes
    const knownFields = [
      "productName", "smallDescription", "description", "categoryId", "subcategoryId",
      "brandId", "price", "discPrice", "stock", "mainImageUrl", "galleryImageUrls",
      "productVideoUrl", "taxId", "isShopByStoreOnly", "shopId", "publish", "popular",
      "dealOfDay", "status", "manufacturer", "madeIn", "requiresApproval", "tags",
      "sellerId", "seller", "headerCategoryId", "category", "subcategory", "brand",
      "mainImage", "galleryImages", "variations", "variationType"
    ];

    const attributes: any = {};
    Object.keys(updateData).forEach(key => {
      if (!knownFields.includes(key)) {
        attributes[key] = updateData[key];
      }
    });
    if (Object.keys(attributes).length > 0) {
      updateData.attributes = attributes;
    }

    // Handle Shop by Store fields
    if (updateData.isShopByStoreOnly !== undefined) {
      updateData.isShopByStoreOnly = updateData.isShopByStoreOnly === true || updateData.isShopByStoreOnly === "true";
    }
    if (updateData.shopId !== undefined) {
      // Allow null to clear shopId
      updateData.shopId = updateData.shopId || null;
    } else if (updateData.isShopByStoreOnly === false) {
      // If shop by store only is false, clear shopId
      updateData.shopId = null;
    }

    // Use findOne and then save to trigger pre-save hooks
    const product = await Product.findOne({ _id: id, seller: sellerId });

    if (!product) {
      // Check if product exists at all
      const existingProduct = await Product.findById(id).select("seller");
      if (existingProduct) {
        console.log(
          "DEBUG updateProduct: product exists but owned by:",
          existingProduct.seller
        );
      }
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Apply updates
    Object.assign(product, updateData);

    await product.save();

    // Re-populate for response
    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name")
      .populate("subcategory", "subcategoryName")
      .populate("headerCategoryId", "name slug")
      .populate("brand", "name")
      .populate("tax", "name rate");

    console.log("DEBUG updateProduct: product updated successfully");

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: populatedProduct,
    });
  }
);

/**
 * Delete product
 */
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;

    console.log("DEBUG deleteProduct: sellerId from token:", sellerId);
    console.log("DEBUG deleteProduct: productId:", id);

    const product = await Product.findOneAndDelete({
      _id: id,
      seller: sellerId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  }
);

/**
 * Update stock for a product
 */
export const updateStock = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = (req as any).user.userId;
  const { id } = req.params;
  const { stock, status } = req.body;

  const product = await Product.findOne({ _id: id, seller: sellerId });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  if (stock !== undefined) {
    product.stock = stock;
    // Automatically update status based on stock
    if (stock === 0) {
      product.status = "Inactive";
    } else if (stock > 0 && product.status === "Inactive") {
      product.status = "Active";
    }
  }
  if (status) {
    product.status = status;
  }
 
  await product.save();

  return res.status(200).json({
    success: true,
    message: "Stock updated successfully",
    data: product,
  });
});

/**
 * Update product status (publish, popular, dealOfDay)
 */
export const updateProductStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;
    const { publish, popular, dealOfDay } = req.body;

    const updateData: any = {};
    if (publish !== undefined) updateData.publish = publish;
    if (popular !== undefined) updateData.popular = popular;
    if (dealOfDay !== undefined) updateData.dealOfDay = dealOfDay;

    const product = await Product.findOneAndUpdate(
      { _id: id, seller: sellerId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product status updated successfully",
      data: product,
    });
  }
);

/**
 * Bulk update stock for multiple products
 */
export const bulkUpdateStock = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { updates } = req.body; // Array of { productId, stock }

    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: "Updates must be an array",
      });
    }

    const results = [];
    for (const update of updates) {
      const { productId, stock } = update;

      const product = await Product.findOne({
        _id: productId,
        seller: sellerId,
      });
      if (product) {
        product.stock = stock;
        if (stock === 0) {
          product.status = "Inactive";
        } else if (stock > 0 && product.status === "Inactive") {
          product.status = "Active";
        }

        await product.save();
        results.push({ productId, success: true });
      } else {
        results.push({
          productId,
          success: false,
          message: "Product not found",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Bulk stock update processed",
      data: results,
    });
  }
);

/**
 * Get all active shops (for seller to select when creating shop-by-store-only products)
 */
export const getShops = asyncHandler(async (_req: Request, res: Response) => {
  const shops = await Shop.find({ isActive: true })
    .select("_id name storeId image")
    .sort({ order: 1, name: 1 })
    .lean();

  return res.status(200).json({
    success: true,
    message: "Shops fetched successfully",
    data: shops || [],
  });
});
