import { Router } from "express";
import adminAuthRoutes from "./adminAuthRoutes";
import sellerAuthRoutes from "./sellerAuthRoutes";
import dashboardRoutes from "./dashboardRoutes";
import customerAuthRoutes from "./customerAuthRoutes";
import deliveryRoutes from "./deliveryRoutes";
import deliveryAuthRoutes from "./deliveryAuthRoutes";
import busRoutes from "../modules/bus/busRoutes";
import hotelRoutes from "../modules/hotel/hotelRoutes";
import { authenticate, requireUserType } from "../middleware/auth";
import customerRoutes from "./customerRoutes";
import sellerRoutes from "./sellerRoutes";
import uploadRoutes from "./uploadRoutes";
import productRoutes from "./productRoutes";
import headerCategoryRoutes from "./headerCategoryRoutes";
import categoryRoutes from "./categoryRoutes";
import orderRoutes from "./orderRoutes";
import returnRoutes from "./returnRoutes";
import reportRoutes from "./reportRoutes";
import walletRoutes from "./walletRoutes";
import taxRoutes from "./taxRoutes";
import customerProductRoutes from "./customerProductRoutes";
import customerCategoryRoutes from "./customerCategoryRoutes";
import customerCouponRoutes from "./customerCouponRoutes";
import customerAddressRoutes from "./customerAddressRoutes";
import customerHomeRoutes from "./customerHomeRoutes";
import customerCartRoutes from "./customerCartRoutes";
import customerDiscountRoutes from "./customerDiscountRoutes";
import wishlistRoutes from "./wishlistRoutes";
import productReviewRoutes from "./productReviewRoutes";
import adminRoutes from "./adminRoutes";
import adminDiscountRoutes from "./adminDiscountRoutes";
import customerTrackingRoutes from "../modules/customer/routes/trackingRoutes";
import deliveryTrackingRoutes from "../modules/delivery/routes/trackingRoutes";
import fcmTokenRoutes from "./fcmTokenRoutes";
import paymentRoutes from "./paymentRoutes";
import phonePeRoutes from "./phonePeRoutes"; 
import sellerWalletRoutes from "./sellerWalletRoutes";
import deliveryWalletRoutes from "./deliveryWalletRoutes";
import adminWithdrawalRoutes from "./adminWithdrawalRoutes";
import bannerRoutes from "./bannerRoutes";
import supportRoutes from "../modules/support/supportRoutes";
import * as configController from "../controllers/configController";
import * as serviceController from "../modules/seller/controllers/serviceController";
import * as roomRentController from "../modules/seller/controllers/roomRentController";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} from "../modules/customer/controllers/customerOrderController";

import notificationRoutes from "./notificationRoutes";

const router = Router();

// Health check route
router.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Public Configuration routes
router.get("/config/public", configController.getPublicConfig);

// Authentication routes
router.use("/auth/admin", adminAuthRoutes);
router.use("/auth/seller", sellerAuthRoutes);
router.use("/auth/customer", customerAuthRoutes);
router.use("/auth/delivery", deliveryAuthRoutes);

// FCM Token routes (protected - requires authentication)
router.use("/fcm-tokens", authenticate, fcmTokenRoutes);

// Delivery routes (protected)
router.use("/delivery", authenticate, requireUserType("Delivery"), deliveryRoutes);
router.use("/delivery", authenticate, requireUserType("Delivery"), deliveryTrackingRoutes);

// Customer routes
router.use("/customer/products", customerProductRoutes);
router.use("/customer/categories", customerCategoryRoutes);
router.use("/customer", customerTrackingRoutes);

router.post("/customer/orders", authenticate, requireUserType("Customer"), createOrder);
router.get("/customer/orders", authenticate, requireUserType("Customer"), getMyOrders);
router.get("/customer/orders/:id", authenticate, requireUserType("Customer"), getOrderById);
router.post("/customer/orders/:id/cancel", authenticate, requireUserType("Customer"), cancelOrder);

router.use("/customer/coupons", customerCouponRoutes);
router.use("/customer/addresses", customerAddressRoutes);
router.use("/customer/home", customerHomeRoutes);
router.use("/customer/cart", customerCartRoutes);
router.use("/customer/wishlist", wishlistRoutes);
router.use("/customer/reviews", productReviewRoutes);
router.use("/customer/discounts", customerDiscountRoutes);
router.use("/customer", customerRoutes);

// Seller dashboard routes
router.use("/seller/dashboard", dashboardRoutes);
router.use("/sellers", sellerRoutes);

// Admin routes
router.use("/admin", adminRoutes);
router.use("/admin/discounts", adminDiscountRoutes);

// Other routes
router.use("/upload", uploadRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/header-categories", headerCategoryRoutes);
router.use("/orders", orderRoutes);
router.use("/returns", returnRoutes);
router.use("/seller/reports", reportRoutes);
router.use("/seller/wallet", walletRoutes);
router.use("/seller/taxes", taxRoutes);
router.use("/payment", paymentRoutes);
router.use("/payments", phonePeRoutes);
router.use("/seller/wallet-new", authenticate, requireUserType("Seller"), sellerWalletRoutes);
router.use("/delivery/wallet", authenticate, requireUserType("Delivery"), deliveryWalletRoutes);
router.use("/admin/withdrawals", authenticate, requireUserType("Admin"), adminWithdrawalRoutes);
router.use("/banners", bannerRoutes);
router.use("/bus", busRoutes);

// Hotel routes (Integrated Rukkoin aliases)
router.use("/hotel", hotelRoutes);
router.use("/hotels", hotelRoutes);
router.use("/bookings", hotelRoutes);
router.use("/rooms", hotelRoutes);
router.use("/hotel-admin", hotelRoutes);

router.use("/customer/notifications", notificationRoutes);
router.use("/support", supportRoutes);

// Service & Room Rent routes
router.post("/seller/services", authenticate, requireUserType("Seller"), serviceController.createService);
router.get("/seller/services", authenticate, requireUserType("Seller"), serviceController.getSellerServices);
router.get("/seller/services/:id", authenticate, requireUserType("Seller"), serviceController.getServiceById);
router.put("/seller/services/:id", authenticate, requireUserType("Seller"), serviceController.updateService);
router.delete("/seller/services/:id", authenticate, requireUserType("Seller"), serviceController.deleteService);
router.patch("/seller/services/:id/toggle-status", authenticate, requireUserType("Seller"), serviceController.toggleServiceStatus);

router.post("/seller/room-rent", authenticate, requireUserType("Seller"), roomRentController.createRoomRent);
router.get("/seller/room-rent", authenticate, requireUserType("Seller"), roomRentController.getSellerRoomRents);
router.get("/seller/room-rent/:id", authenticate, requireUserType("Seller"), roomRentController.getRoomRentById);
router.put("/seller/room-rent/:id", authenticate, requireUserType("Seller"), roomRentController.updateRoomRent);
router.delete("/seller/room-rent/:id", authenticate, requireUserType("Seller"), roomRentController.deleteRoomRent);
router.patch("/seller/room-rent/:id/toggle-status", authenticate, requireUserType("Seller"), roomRentController.toggleRoomRentStatus);

export default router;
