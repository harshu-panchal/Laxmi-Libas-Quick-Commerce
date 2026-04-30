import { Router } from "express";
import { getDashboardStats } from "../modules/seller/controllers/dashboardController";
import { authenticate, requireUserType } from "../middleware/auth";

const router = Router();

// All routes require authentication and seller user type
router.use(authenticate);
router.use(requireUserType("Seller"));

// Get seller's dashboard statistics
router.get("/stats", getDashboardStats);

// Analytics
import * as sellerAnalyticsController from "../modules/seller/controllers/sellerAnalyticsController";
router.get("/analytics", sellerAnalyticsController.getSellerAnalytics);

export default router;
