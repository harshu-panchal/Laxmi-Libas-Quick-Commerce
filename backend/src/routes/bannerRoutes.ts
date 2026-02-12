
import { Router } from "express";
import { authenticate, requireUserType } from "../middleware/auth";
import {
    getBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    getActiveBanners,
} from "../modules/admin/controllers/adminBannerController";

const router = Router();

// Public route to get active banners
router.get("/active", getActiveBanners);

// Admin routes
router.use(authenticate, requireUserType("Admin"));
router.get("/", getBanners);
router.post("/", createBanner);
router.put("/:id", updateBanner);
router.delete("/:id", deleteBanner);

export default router;
