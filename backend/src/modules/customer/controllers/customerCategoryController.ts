import { Request, Response } from "express";
import Category from "../../../models/Category";
import SubCategory from "../../../models/SubCategory";
import Product from "../../../models/Product";
import Seller from "../../../models/Seller";
import mongoose from "mongoose";
import { cache } from "../../../utils/cache";

import HeaderCategory from "../../../models/HeaderCategory";

// Get all categories (public) - with caching
export const getCategories = async (_req: Request, res: Response) => {
  try {
    const cacheKey = "customer-categories-list";

    // Try cache first
    let categories = cache.get(cacheKey);

    if (!categories) {
      const headerCategories = await HeaderCategory.find({
        status: "Published", // Only return active published categories
      })
        .sort({ order: 1 })
        .lean();

      // Map to consistent Category schema
      categories = headerCategories.map(hc => ({
        _id: hc._id,
        id: hc._id,
        name: hc.name,
        slug: hc.slug,
        theme: hc.theme,
        isActive: hc.status === "Published",
        icon: hc.iconName,
        image: hc.iconName, // For fallback
        description: "",
        color: hc.theme,
      }));

      // Cache for 10 minutes
      cache.set(cacheKey, categories, 10 * 60 * 1000);
    }

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

// Get all categories with their subcategories (for menu/sidebar) - with caching
export const getCategoriesWithSubs = async (_req: Request, res: Response) => {
  try {
    const cacheKey = "customer-categories-tree";

    // Try cache first
    let categoriesWithSubs = cache.get(cacheKey);

    if (categoriesWithSubs) {
      return res.status(200).json({
        success: true,
        data: categoriesWithSubs,
      });
    }

    const categories = await Category.find({ status: "Active" })
      .sort({ order: 1 })
      .lean();

    const approvedSellers = await Seller.find({ status: "Approved" }).select("_id");
    const approvedIds = approvedSellers.map(s => s._id);

    // Build product count maps to filter categories/subcategories that actually have products
    const activeProductMatch = { 
       status: "Active", 
       publish: true,
       seller: { $in: approvedIds }
    };

    const [categoryCounts, subcategoryCounts] = await Promise.all([
      Product.aggregate([
        { $match: activeProductMatch },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      Product.aggregate([
        { $match: activeProductMatch },
        { $group: { _id: "$subcategory", count: { $sum: 1 } } },
      ]),
    ]);

    const categoryCountMap = new Map<string, number>();
    categoryCounts.forEach((item) => {
      if (item._id) {
        categoryCountMap.set(item._id.toString(), item.count);
      }
    });

    const subcategoryCountMap = new Map<string, number>();
    subcategoryCounts.forEach((item) => {
      if (item._id) {
        subcategoryCountMap.set(item._id.toString(), item.count);
      }
    });

    categoriesWithSubs = await Promise.all(
      categories.map(async (category) => {
        // Query Category model for hierarchical subcategories
        const catSubs = await Category.find({
          parentId: { $in: [category._id, category._id.toString()] },
          status: "Active"
        })
          .sort({ order: 1 })
          .select("name image order slug");

        // Query old SubCategory model for legacy subcategories
        const oldSubs = await SubCategory.find({
          category: { $in: [category._id, category._id.toString()] },
        })
          .sort({ order: 1 })
          .select("name image order slug");

        // Format and combine
        const combinedSubs = [
          ...catSubs.map(sub => ({
            _id: sub._id,
            id: sub._id,
            name: sub.name,
            slug: sub.slug || sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            image: sub.image || "",
            order: sub.order || 0
          })),
          ...oldSubs.map(sub => ({
            _id: sub._id,
            id: sub._id,
            name: sub.name,
            slug: (sub as any).slug || sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            image: sub.image || "",
            order: sub.order || 0
          }))
        ];

        // Deduplicate combined list by _id
        const seenSubs = new Set<string>();
        const uniqueSubs = combinedSubs.filter(sub => {
          const idStr = sub._id.toString();
          if (seenSubs.has(idStr)) return false;
          seenSubs.add(idStr);
          return true;
        });

        // Sort by order
        uniqueSubs.sort((a, b) => a.order - b.order);

        // Keep only subcategories that have at least one product
        const filteredSubs = uniqueSubs.filter((sub) =>
          subcategoryCountMap.has(sub._id.toString())
        );

        const directCategoryCount =
          categoryCountMap.get(category._id.toString()) || 0;
        const subsProductCount = filteredSubs.reduce(
          (total, sub) =>
            total + (subcategoryCountMap.get(sub._id.toString()) || 0),
          0
        );
        const totalProducts = directCategoryCount + subsProductCount;

        // Exclude category if no products in category or its subcategories
        if (totalProducts === 0) {
          return null;
        }

        return {
          ...category,
          subcategories: filteredSubs,
          totalProducts,
        };
      })
    ).then((list) => list.filter(Boolean));

    // Cache for 10 minutes
    cache.set(cacheKey, categoriesWithSubs, 10 * 60 * 1000);

    return res.status(200).json({
      success: true,
      data: categoriesWithSubs,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching categories tree",
      error: error.message,
    });
  }
};

// Get single category details with subcategories - with caching
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cacheKey = `customer-category-${id}`;

    // Try cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached,
      });
    }

    console.log(`[getCategoryById] Looking for category with id/slug: ${id}`);
    let category;

    // Try to find by ObjectId first (only active categories for public endpoint)
    if (mongoose.Types.ObjectId.isValid(id)) {
      category = await Category.findOne({
        _id: id,
        status: "Active",
      }).lean();
    }

    // If not found by ID, try by slug (case-insensitive, only active categories)
    if (!category) {
      // Try exact slug match first
      category = await Category.findOne({
        slug: id,
        status: "Active",
      }).lean();

      // Try case-insensitive slug match
      if (!category) {
        category = await Category.findOne({
          slug: { $regex: new RegExp(`^${id}$`, "i") },
          status: "Active",
        }).lean();
      }

      // Try name match as fallback (case-insensitive)
      if (!category) {
        // First try standard replacement
        let namePattern = id.replace(/[-_]/g, " ");
        category = await Category.findOne({
          name: { $regex: new RegExp(`^${namePattern}$`, "i") },
          status: "Active",
        }).lean();

        // If not found, try replacing " and " with " & " specifically for categories like "Vegetables & Fruits"
        if (!category && id.includes("and")) {
           const withAmpersand = id.replace(/-and-/g, " & ").replace(/-/g, " ");
           category = await Category.findOne({
             name: { $regex: new RegExp(`^${withAmpersand}$`, "i") },
             status: "Active",
           }).lean();
        }
      }
    }

    if (!category) {
      // Check if it's a subcategory
      if (mongoose.Types.ObjectId.isValid(id)) {
        const subcategory = await SubCategory.findById(id).lean();
        if (subcategory) {
          // Find the parent category
          category = await Category.findById(subcategory.category).lean();
          if (category) {
            // Return both for the frontend to decide
            const subcategories = await SubCategory.find({
              category: category._id,
            })
              .select("name image order category")
              .sort({
                order: 1,
              });
            return res.status(200).json({
              success: true,
              data: {
                category,
                subcategories,
                currentSubcategory: subcategory,
              },
            });
          }
        }
      }

      console.log(`[getCategoryById] Category not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: `Category not found: ${id}`,
      });
    }

    console.log(
      `[getCategoryById] Found category: ${category.name} (${category._id})`
    );

    // Ensure category._id is treated as ObjectId for the query
    let catId = category._id;
    if (typeof catId === 'string') {
        try {
            catId = new mongoose.Types.ObjectId(catId);
        } catch (e) {
            console.error("Failed to cast category ID to ObjectId:", e);
        }
    }

    // Query Category model for hierarchical subcategories (children)
    const categorySubcategories = await Category.find({
      parentId: { $in: [catId, catId.toString()] },
      status: "Active"
    })
      .select("name image order slug icon")
      .sort({
        order: 1,
      })
      .lean();

    // Query SubCategory model for legacy subcategories
    const oldSubcategories = await SubCategory.find({
      category: { $in: [catId, catId.toString()] }
    })
      .select("name image order slug")
      .sort({
        order: 1,
      })
      .lean();

    // Combine and format consistently
    const combined = [
      ...categorySubcategories.map(cat => ({
        _id: cat._id,
        id: cat._id,
        name: cat.name,
        slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        image: cat.image || "",
        order: cat.order || 0,
        icon: (cat as any).icon || ""
      })),
      ...oldSubcategories.map(sub => ({
        _id: sub._id,
        id: sub._id,
        name: sub.name,
        slug: (sub as any).slug || sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        image: sub.image || "",
        order: sub.order || 0,
        icon: ""
      }))
    ];

    // Deduplicate by _id
    const seenSubs = new Set<string>();
    const subcategoriesMerged = combined.filter(sub => {
      const idStr = sub._id.toString();
      if (seenSubs.has(idStr)) return false;
      seenSubs.add(idStr);
      return true;
    });

    // Sort by order
    subcategoriesMerged.sort((a, b) => a.order - b.order);

    console.log(`[getCategoryById] Found ${subcategoriesMerged.length} subcategories for ${category.name}`);

    const responseData = {
      category,
      subcategories: subcategoriesMerged,
      currentSubcategory: null,
    };

    // Cache for 10 minutes
    cache.set(cacheKey, responseData, 10 * 60 * 1000);

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching category details",
      error: error.message,
    });
  }
};
