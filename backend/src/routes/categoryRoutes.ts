import { Router } from "express";
import {
  getCategories,
  getCategoryById,
  getSubcategories,
  getAllCategoriesWithSubcategories,
  getAllSubcategories,
  getSubSubCategories,
} from "../modules/seller/controllers/categoryController";
import { noCache } from "../middleware/cache";

const router = Router();

// Apply no-cache to all category retrieval routes
router.use(noCache);

// Get all categories (parent categories only by default)
router.get("/", getCategories);


// Get all subcategories (across all categories)
router.get("/subcategories", getAllSubcategories);

// Get all categories with nested subcategories
router.get("/all-with-subcategories", getAllCategoriesWithSubcategories);

// Get category by ID
router.get("/:id", getCategoryById);

// Get subcategories of a specific category
// Get subcategories of a specific category
router.get("/:id/subcategories", getSubcategories);

// Get sub-subcategories of a specific subcategory
router.get("/:subCategoryId/sub-subcategories", getSubSubCategories);

export default router;

