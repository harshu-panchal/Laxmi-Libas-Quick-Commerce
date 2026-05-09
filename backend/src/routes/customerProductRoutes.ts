import { Router } from "express";
import { getProducts, getProductById, getQuickProducts } from "../modules/customer/controllers/customerProductController";

const router = Router();

// Public routes (no auth required for viewing products)
router.get("/", getProducts);
router.get("/quick", getQuickProducts);
router.get("/:id", getProductById);

export default router;
