import { Request, Response } from "express";
import mongoose from "mongoose";
import Category from "../../../models/Category";
import SubCategory from "../../../models/SubCategory";
import Product from "../../../models/Product";
import { asyncHandler } from "../../../utils/asyncHandler";

/**
 * Get all categories (parent categories only by default)
 */
export const getCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const { includeSubcategories, search } = req.query;

    // Build query - by default, get only parent categories (no parentId)
    const query: any = { parentId: null };

    // If includeSubcategories is true, get all categories
    if (includeSubcategories === "true") {
      delete query.parentId;
    }

    // Search filter
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const categories = await Category.find(query)
      .populate("headerCategoryId", "name slug")
      .sort({ name: 1 });

    // Get subcategory and product counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const subcategoryCount = await SubCategory.countDocuments({
          category: category._id,
        });

        const productCount = await Product.countDocuments({
          category: category._id, // Note: Product model uses 'category', not 'categoryId'
        });

        return {
          ...category.toObject(),
          totalSubcategory: subcategoryCount,
          totalProduct: productCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categoriesWithCounts,
    });
  }
);

/**
 * Get category by ID
 */
export const getCategoryById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Get counts
    const subcategoryCount = await Category.countDocuments({
      parentId: category._id,
    });

    const productCount = await Product.countDocuments({
      categoryId: category._id,
    });

    const categoryWithCounts = {
      ...category.toObject(),
      totalSubcategory: subcategoryCount,
      totalProduct: productCount,
    };

    return res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      data: categoryWithCounts,
    });
  }
);

/**
 * Get subcategories by parent category ID
 * Supports both old SubCategory model and new Category model (with parentId)
 */
export const getSubcategories = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      search,
      page = "1",
      limit = "100",
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    // Support both ID and Slug
    let parentCategory;
    if (mongoose.Types.ObjectId.isValid(id)) {
      parentCategory = await Category.findById(id);
    } else {
      parentCategory = await Category.findOne({ slug: id });
    }

    if (!parentCategory) {
      return res.status(404).json({
        success: false,
        message: "Parent category not found",
      });
    }
    
    // Ensure id is the ObjectId for following queries if we found it by slug
    const objectId = parentCategory._id;

    console.log(`Fetching subcategories for category: ${parentCategory.name} (${objectId})`);

    // Pagination parameters
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 100;
    const skip = (pageNum - 1) * limitNum;

    // Sort parameters
    const sort: any = {};
    const sortField = sortBy === "subcategoryName" ? "name" : (sortBy as string || "name");
    sort[sortField] = sortOrder === "desc" ? -1 : 1;

    // Search pattern
    const searchPattern = search ? { $regex: search as string, $options: "i" } : null;

    // 1. Fetch from Category model (with parentId)
    const categoryQuery: any = { parentId: objectId, status: "Active" };
    if (searchPattern) categoryQuery.name = searchPattern;

    const categorySubcategories = await Category.find(categoryQuery)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // 2. Fetch from old SubCategory model
    const oldSubQuery: any = { category: objectId };
    if (searchPattern) oldSubQuery.name = searchPattern;

    const oldSubcategories = await SubCategory.find(oldSubQuery)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Map and combine
    const combined = [
      ...categorySubcategories.map(cat => ({
        _id: cat._id,
        name: cat.name,
        subcategoryName: cat.name,
        categoryName: parentCategory.name || "Category",
        image: cat.image,
        subcategoryImage: cat.image,
        order: cat.order || 0,
        totalProduct: 0
      })),
      ...oldSubcategories.map(sub => ({
        _id: sub._id,
        name: sub.name,
        subcategoryName: sub.name,
        categoryName: parentCategory.name || "Category",
        image: sub.image,
        subcategoryImage: sub.image,
        order: sub.order || 0,
        totalProduct: 0
      }))
    ];

    // Deduplicate
    const unique = Array.from(new Map(combined.map(item => [item._id.toString(), item])).values());

    // Sort combined list
    unique.sort((a, b) => {
      const valA = (a as any)[sortField];
      const valB = (b as any)[sortField];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === "desc" ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      return sortOrder === "desc" ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
    });

    // Final slice and count products
    const finalSubcats = await Promise.all(
      unique.slice(0, limitNum).map(async (sub) => {
        try {
          const count = await Product.countDocuments({
            $or: [{ subcategory: sub._id }, { category: sub._id }]
          });
          return { ...sub, totalProduct: count };
        } catch (e) {
          return sub;
        }
      })
    );

    const totalCount = await Category.countDocuments(categoryQuery) + await SubCategory.countDocuments(oldSubQuery);

    return res.status(200).json({
      success: true,
      message: "Subcategories fetched successfully",
      data: finalSubcats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  }
);

/**
 * Get all categories with their subcategories nested
 */
export const getAllCategoriesWithSubcategories = asyncHandler(
  async (_req: Request, res: Response) => {
    // Get all parent categories
    const parentCategories = await Category.find({ parentId: null }).sort({
      name: 1,
    });

    // Get all subcategories grouped by parent
    const categoriesWithSubcategories = await Promise.all(
      parentCategories.map(async (category) => {
        const subcategories = await SubCategory.find({
          category: category._id,
        }).sort({ name: 1 });

        // Get product counts
        const subcategoriesWithCounts = await Promise.all(
          subcategories.map(async (subcategory) => {
            const productCount = await Product.countDocuments({
              subcategory: subcategory._id,
            });

            return {
              ...subcategory.toObject(),
              totalProduct: productCount,
            };
          })
        );

        const subcategoryCount = subcategories.length;
        const productCount = await Product.countDocuments({
          category: category._id,
        });

        return {
          ...category.toObject(),
          totalSubcategory: subcategoryCount,
          totalProduct: productCount,
          subcategories: subcategoriesWithCounts,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Categories with subcategories fetched successfully",
      data: categoriesWithSubcategories,
    });
  }
);

/**
 * Get all subcategories (across all categories)
 */
export const getAllSubcategories = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      search,
      page = "1",
      limit = "100",
      sortBy = "name",
      sortOrder = "asc",
      categoryId
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 100;
    const skip = (pageNum - 1) * limitNum;

    const searchPattern = search ? { $regex: search as string, $options: "i" } : null;

    // 1. Query Category collection for hierarchical child categories (where parentId is NOT null)
    const catQuery: any = { parentId: { $ne: null }, status: "Active" };
    if (searchPattern) catQuery.name = searchPattern;
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId as string)) {
      catQuery.parentId = new mongoose.Types.ObjectId(categoryId as string);
    }

    const categorySubcategories = await Category.find(catQuery)
      .populate("parentId", "name")
      .lean();

    // 2. Query legacy SubCategory collection as fallback
    const subQuery: any = {};
    if (searchPattern) subQuery.name = searchPattern;
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId as string)) {
      subQuery.category = new mongoose.Types.ObjectId(categoryId as string);
    }

    const legacySubcategories = await SubCategory.find(subQuery)
      .populate("category", "name image")
      .lean();

    // Map and combine
    const combined = [
      ...categorySubcategories.map((c: any) => ({
        id: c._id,
        _id: c._id,
        categoryName: c.parentId?.name || "Category",
        subcategoryName: c.name,
        subcategoryImage: c.image || "",
        order: c.order || 0
      })),
      ...legacySubcategories.map((s: any) => ({
        id: s._id,
        _id: s._id,
        categoryName: s.category?.name || "Category",
        subcategoryName: s.name,
        subcategoryImage: s.image || "",
        order: s.order || 0
      }))
    ];

    // Deduplicate by id
    const unique = Array.from(new Map(combined.map(item => [item.id.toString(), item])).values());

    // Sort combined list
    const sortField = sortBy === "subcategoryName" ? "subcategoryName" : "subcategoryName";
    unique.sort((a, b) => {
      const valA = (a as any)[sortField];
      const valB = (b as any)[sortField];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === "desc" ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      return sortOrder === "desc" ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
    });

    // Final slice and count products
    const finalSubcats = await Promise.all(
      unique.slice(skip, skip + limitNum).map(async (sub) => {
        try {
          const count = await Product.countDocuments({
            $or: [{ subcategory: sub._id }, { category: sub._id }]
          });
          return { ...sub, totalProduct: count };
        } catch (e) {
          return sub;
        }
      })
    );

    const total = unique.length;

    return res.status(200).json({
      success: true,
      message: "Subcategories fetched successfully",
      data: finalSubcats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  }
);

/**
 * Get sub-subcategories by subcategory ID
 */
export const getSubSubCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const { subCategoryId } = req.params;
    const { search, isActive } = req.query;

    // Query Category model where parentId is the subcategory ID
    const query: any = { parentId: subCategoryId };

    if (isActive === "true") {
      query.status = "Active";
    }

    if (search) {
      query.name = { $regex: search as string, $options: "i" };
    }

    const subSubCategories = await Category.find(query)
      .sort({ order: 1, name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Sub-subcategories fetched successfully",
      data: subSubCategories,
    });
  }
);
