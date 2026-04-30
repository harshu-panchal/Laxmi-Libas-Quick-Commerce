import { Router } from "express"; // Fix: Triggering re-load
import {
  getReturnRequests,
  getReturnRequestById,
  updateReturnStatus,
} from "../modules/seller/controllers/returnController";
import { authenticate, requireUserType } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// All routes require authentication and seller user type
router.use(authenticate);
router.use(requireUserType("Seller"));

// Get seller's return requests with filters
router.get("/", asyncHandler(getReturnRequests));

// Get return request by ID
router.get("/:id", asyncHandler(getReturnRequestById));

// Update return request status
router.patch("/:id/status", asyncHandler(updateReturnStatus));

export default router;
