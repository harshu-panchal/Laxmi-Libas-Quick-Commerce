import { Router } from "express";
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  shipOrder,
  markAsPacked,
  readyForPickup,
  printInvoice,
  printLabel,
} from "../modules/seller/controllers/orderController";
import { authenticate, requireUserType } from "../middleware/auth";

const router = Router();

// All routes require authentication and seller user type
router.use(authenticate);
router.use(requireUserType("Seller"));

// Get seller's orders with filters
router.get("/", getOrders);

// Get order by ID
router.get("/:id", getOrderById);

// Update order status
router.patch("/:id/status", updateOrderStatus);

// Shipment Actions
router.patch("/:id/pack", markAsPacked);
router.patch("/:id/ready-pickup", readyForPickup);
router.get("/:id/invoice", printInvoice);
router.get("/:id/shipping-label", printLabel);

// Ship order
router.post("/:id/ship", shipOrder);

export default router;
