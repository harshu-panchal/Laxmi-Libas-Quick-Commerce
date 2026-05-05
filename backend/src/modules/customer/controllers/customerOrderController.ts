import { Request, Response } from "express";
import Order from "../../../models/Order";
import Product from "../../../models/Product";
import OrderItem from "../../../models/OrderItem";
import { sendNotification } from "../../../services/notificationService";
import Customer from "../../../models/Customer";
import Seller from "../../../models/Seller";
import mongoose from "mongoose";
// import { calculateDistance } from "../../../utils/locationHelper";
import { notifySellersOfOrderUpdate } from "../../../services/sellerNotificationService";
import { generateDeliveryOtp } from "../../../services/deliveryOtpService";
// import AppSettings from "../../../models/AppSettings";
// import { getRoadDistances } from "../../../services/mapService";
import { Server as SocketIOServer } from "socket.io";
import { getOrderItemCommissionRate } from "../../../services/commissionService";
import { DiscountService } from "../../../services/discountService";
import { InventoryService } from "../../../services/inventoryService";
import PaymentIntent from "../../../models/PaymentIntent";
import { finalizeOrderCreation } from "../../../services/orderService";

// Create a new order or payment intent
export const createOrder = async (req: Request, res: Response) => {
    try {
        const { items, address, paymentMethod, fees, deliveryInstructions, tip } = req.body;
        const userId = req.user!.userId;

        console.log("DEBUG: Order request received:", { userId, paymentMethod, itemsCount: items?.length });

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Order must have at least one item" });
        }

        if (!address) {
            return res.status(400).json({ success: false, message: "Delivery address is required" });
        }

        // Validate items and discounts
        try {
            const itemsForValidation = items.map((item: any) => ({
                productId: item.product.id || item.product._id,
                quantity: Number(item.quantity),
                claimedDiscountPercent: item.claimedDiscountPercent,
                claimedDiscountAmount: item.claimedDiscountAmount
            }));
            const validation = await DiscountService.validateOrderDiscount(itemsForValidation);
            if (!validation.valid) {
                return res.status(400).json({ success: false, message: validation.message });
            }
        } catch (err: any) {
            return res.status(400).json({ success: false, message: err.message });
        }

        // ── Case 1: COD ────────
        if (paymentMethod === 'COD') {
            const io = req.app.get("io");
            const createdOrders = await finalizeOrderCreation(userId, req.body, io, 'Pending');
            
            return res.status(201).json({
                success: true,
                message: "Order placed successfully",
                data: {
                    parentOrderId: createdOrders[0].parentOrderId,
                    orders: createdOrders,
                    primaryOrderId: createdOrders[0]._id
                },
            });
        }

        // ── Case 2: Online (Delayed Order Creation) ────────
        // Calculate total for payment with variant support
        let subtotal = 0;
        for (const item of items) {
            const product = await Product.findById(item.product.id || item.product._id);
            if (!product) continue;

            const variantValue = item.variant || item.variation || null;
            let itemPrice = (product.discPrice && product.discPrice > 0) ? product.discPrice : product.price;

            if (variantValue && product.variations && product.variations.length > 0) {
                const targetVar = variantValue.toString().toLowerCase().trim();
                const variant = product.variations.find((v: any) => {
                    const vId = v._id?.toString();
                    const vTitle = v.title?.toString().toLowerCase().trim();
                    const vValue = v.value?.toString().toLowerCase().trim();
                    const vName = v.name?.toString().toLowerCase().trim();
                    
                    return vId === variantValue.toString() || 
                           vTitle === targetVar || 
                           vValue === targetVar || 
                           vName === targetVar;
                });
                
                if (variant) {
                    itemPrice = (variant.discPrice && variant.discPrice > 0) ? variant.discPrice : variant.price;
                }
            }
            
            subtotal += itemPrice * (item.quantity || 1);
        }
        
        const total = subtotal + (fees?.deliveryFee || 0) + (fees?.platformFee || 0) + (fees?.ecomShippingFee || 0) + (tip || 0);

        // Create PaymentIntent
        const merchantOrderId = `MT${Date.now()}${Math.floor(Math.random() * 1000)}`;
        // Lock stock now so it's reserved while user is paying
        try {
            await InventoryService.lockProductStock(userId, items);
        } catch (stockErr: any) {
            return res.status(400).json({ success: false, message: stockErr.message });
        }

        const intent = new PaymentIntent({
            userId,
            items,
            address,
            fees,
            deliveryInstructions,
            tip,
            total,
            merchantOrderId,
            status: 'Pending'
        });
        await intent.save();

        return res.status(200).json({
            success: true,
            message: "Payment intent created",
            data: {
                paymentRequired: true,
                merchantOrderId,
                total,
                // Backward compatibility for frontend
                primaryOrderId: merchantOrderId 
            }
        });

    } catch (error: any) {
        console.error("DEBUG: Order creation error:", error);
        try {
            require('fs').writeFileSync('order_error_log.txt', String(error.stack || error.message));
        } catch (e) {}
        
        return res.status(500).json({
            success: false,
            message: "Failed to place order",
            error: error.message
        });
    }
};


// Get authenticated customer's orders
export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { status, page = 1, limit = 10 } = req.query;
        const query: any = { customer: userId };
        if (status) query.status = status;

        const skip = (Number(page) - 1) * Number(limit);
        const orders = await Order.find(query)
            .populate({
                path: 'items',
                populate: { path: 'product', select: 'productName mainImage price' }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Order.countDocuments(query);
        const transformedOrders = orders.map(order => {
            const orderObj = order.toObject();
            return {
                ...orderObj,
                id: orderObj._id.toString(),
                totalAmount: orderObj.total || orderObj.grandTotal || 0,
                totalItems: orderObj.items?.length || 0,
                fees: {
                    platformFee: orderObj.platformFee || 0,
                    deliveryFee: orderObj.shipping || 0
                }
            };
        });

        return res.status(200).json({
            success: true,
            data: transformedOrders,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: "Error fetching orders", error: error.message });
    }
};

// Get single order details
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        const order = await Order.findOne({ _id: id, customer: userId })
            .populate({
                path: 'items',
                populate: [
                    { path: 'product', select: 'productName mainImage pack manufacturer price' },
                    { path: 'seller', select: 'storeName city phone fssaiLicNo' }
                ]
            })
            .populate('deliveryBoy', 'name phone profileImage vehicleNumber');

        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        let customer = await Customer.findById(userId).select('deliveryOtp');
        
        // Generate OTP if missing (for legacy customers)
        if (customer && !customer.deliveryOtp) {
            const customerFull = await Customer.findById(userId);
            if (customerFull?.phone) {
                customer.deliveryOtp = customerFull.phone.slice(-4);
            } else {
                customer.deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
            }
            await customer.save();
        }

        const orderObj = order.toObject();
        const transformedOrder = {
            ...orderObj,
            id: orderObj._id.toString(),
            totalAmount: orderObj.total || orderObj.grandTotal || 0,
            totalItems: orderObj.items?.length || 0,
            fees: {
                platformFee: orderObj.platformFee || 0,
                deliveryFee: orderObj.shipping || 0
            },
            address: orderObj.deliveryAddress,
            deliveryOtp: customer?.deliveryOtp,
            deliveryPartner: orderObj.deliveryBoy
        };

        return res.status(200).json({ success: true, data: transformedOrder });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: "Error fetching order detail", error: error.message });
    }
};

/**
 * Refresh Delivery OTP
 */
export const refreshDeliveryOtp = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const order = await Order.findOne({ _id: id, customer: userId });
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        if (order.status === 'Delivered') return res.status(400).json({ success: false, message: "Already delivered" });

        const result = await generateDeliveryOtp(id);
        const io = (req.app as any).get("io");
        if (io) io.to(`order-${id}`).emit('delivery-otp-refreshed', { orderId: id, deliveryOtp: order.deliveryOtp });

        return res.status(200).json(result);
    } catch (error: any) {
        return res.status(500).json({ success: false, message: "Failed to refresh OTP", error: error.message });
    }
};

// Cancel Order
export const cancelOrder = async (req: Request, res: Response) => {
    let session: mongoose.ClientSession | null = null;
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user!.userId;
        if (!reason) return res.status(400).json({ success: false, message: "Reason required" });

        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (e) { session = null; }

        const order = await Order.findOne({ _id: id, customer: userId }).session(session as any);
        if (!order) {
            if (session) await session.abortTransaction();
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (['Delivered', 'Cancelled', 'Returned', 'Rejected', 'Out for Delivery', 'Shipped'].includes(order.status)) {
            if (session) await session.abortTransaction();
            return res.status(400).json({ success: false, message: `Cannot cancel order in ${order.status} status` });
        }

        // Restore stock
        for (const itemId of order.items) {
            const orderItem = await OrderItem.findById(itemId).session(session as any);
            if (orderItem) {
                await Product.findByIdAndUpdate(orderItem.product, { $inc: { stock: orderItem.quantity } }, { session });
                orderItem.status = 'Cancelled';
                await orderItem.save({ session });
            }
        }

        order.status = 'Cancelled';
        order.cancellationReason = reason;
        order.cancelledAt = new Date();
        order.cancelledBy = new mongoose.Types.ObjectId(userId);

        // --- NEW: REFUND TRACKING ---
        if (order.paymentStatus === 'Paid') {
            order.refundStatus = 'Pending';
            order.refundAmount = order.total;
        }
        // -----------------------------

        if (session) {
            await order.save({ session });
            await session.commitTransaction();
        } else {
            await order.save();
        }

        // Notify
        const io = (req.app as any).get("io");
        if (io) {
            await notifySellersOfOrderUpdate(io, order, 'ORDER_CANCELLED');
            if (order.deliveryBoy) {
                io.to(`delivery-${order.deliveryBoy}`).emit('order-cancelled', { orderId: order._id, message: "Order cancelled by customer" });
            }
            io.to(`order-${order._id}`).emit('order-cancelled', { orderId: order._id, status: 'Cancelled' });
        }

        return res.status(200).json({ success: true, message: "Order cancelled" });

    } catch (error: any) {
        if (session) await session.abortTransaction().catch(() => { });
        return res.status(500).json({ success: false, message: "Error cancelling order", error: error.message });
    } finally {
        if (session) session.endSession();
    }
};

/**
 * Request Return for delivered item
 */
export const requestReturn = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user!.userId;

        if (!reason) return res.status(400).json({ success: false, message: "Reason for return is required" });

        const order = await Order.findOne({ _id: id, customer: userId });
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        if (order.status !== 'Delivered') {
            return res.status(400).json({ success: false, message: "Only delivered orders can be returned" });
        }

        // Check if return window is active
        const deliveredAt = order.updatedAt; // Or specific delivery timestamp
        const daysSinceDelivery = Math.floor((Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceDelivery > 7) {
            return res.status(400).json({ success: false, message: "Return window (7 days) has expired" });
        }

        order.status = 'Returned';
        order.returnStatus = 'Requested';
        order.returnReason = reason;
        
        await order.save();

        // Notify Seller
        const io = (req.app as any).get("io");
        if (io) {
            await notifySellersOfOrderUpdate(io, order, 'STATUS_UPDATE');
        }

        return res.status(200).json({ 
            success: true, 
            message: "Return request submitted successfully. Our team will review it.", 
            data: order 
        });

    } catch (error: any) {
        return res.status(500).json({ success: false, message: "Error requesting return", error: error.message });
    }
};
