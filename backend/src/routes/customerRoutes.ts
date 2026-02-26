import { Router } from "express";
import * as customerController from "../modules/customer/controllers/customerController";
import * as customerNotificationController from "../modules/customer/controllers/customerNotificationController";
import { authenticate } from "../middleware/auth";

const router = Router();

// Get customer profile (protected route)
router.get("/profile", authenticate, customerController.getProfile);

// Update customer profile (protected route)
router.put("/profile", authenticate, customerController.updateProfile);

// Update customer location (protected route)
router.post("/location", authenticate, customerController.updateLocation);

// Get customer location (protected route)
router.get("/location", authenticate, customerController.getLocation);

// Notifications (protected routes)
router.get("/notifications", authenticate, customerNotificationController.getNotifications);
router.put("/notifications/:id/read", authenticate, customerNotificationController.markNotificationRead);
router.put("/notifications/mark-all-read", authenticate, customerNotificationController.markAllNotificationsRead);

export default router;
