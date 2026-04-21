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

// Create a new order
export const createOrder = async (req: Request, res: Response) => {
    let session: mongoose.ClientSession | null = null;
    try {
        // Only start session if we are on a replica set (required for transactions)
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (sessionError) {
            console.warn("MongoDB Transactions not supported or failed to start. Proceeding without transaction.");
            session = null;
        }

        const { items, address, paymentMethod, fees, deliveryInstructions, tip } = req.body;
        const userId = req.user!.userId;

        // Log incoming request for debugging
        console.log("DEBUG: Order creation request:", {
            userId,
            itemsCount: items?.length,
            hasAddress: !!address,
            paymentMethod,
        });

        if (!items || items.length === 0) {
            if (session) await session.abortTransaction();
            return res.status(400).json({ success: false, message: "Order must have at least one item" });
        }

        // ── Duplicate Order Guard (prevent double-tapping Place Order) ────────
        const tenSecondsAgo = new Date(Date.now() - 10000);
        const recentProductIds = items.map((i: any) => i.product.id || i.product._id).filter(Boolean);
        const duplicateCheck = await Order.findOne({
            customer: new mongoose.Types.ObjectId(userId),
            status: { $in: ['Pending', 'Received'] },
            paymentMethod: paymentMethod || 'COD',
            createdAt: { $gte: tenSecondsAgo },
        }).lean();

        if (duplicateCheck) {
            if (session) await session.abortTransaction();
            return res.status(409).json({
                success: false,
                message: "Duplicate order detected. Your previous order was just placed.",
                existingOrderId: duplicateCheck._id,
            });
        }

        // Validate Quantity-Based Discounts before proceeding
        try {
            const itemsForValidation = await Promise.all(items.map(async (item: any) => {
                const prodId = item.product.id || item.product._id;
                if (!mongoose.Types.ObjectId.isValid(prodId)) {
                    throw new Error(`Invalid Product ID: ${prodId}`);
                }
                const product = await Product.findById(prodId).select('category seller price discPrice');
                if (!product) throw new Error(`Product ${prodId} not found`);

                const itemPrice = (product.discPrice && product.discPrice > 0)
                    ? product.discPrice
                    : (product.price || 0);

                return {
                    productId: product._id.toString(),
                    categoryId: product.category?.toString(),
                    sellerId: product.seller?.toString(),
                    quantity: Number(item.quantity),
                    price: itemPrice,
                    claimedDiscountPercent: item.claimedDiscountPercent,
                    claimedDiscountAmount: item.claimedDiscountAmount
                };
            }));

            const validation = await DiscountService.validateOrderDiscount(itemsForValidation);
            if (!validation.valid) {
                if (session) await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: validation.message || "Invalid discount claimed",
                });
            }
        } catch (discountErr: any) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: discountErr.message || "Failed to validate discounts",
            });
        }

        if (!address) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Delivery address is required",
            });
        }

        // Validate required address fields
        if (!address.city || (typeof address.city === 'string' && address.city.trim() === '')) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "City is required in delivery address",
            });
        }

        // Fetch customer details
        const customer = await Customer.findById(userId);
        if (!customer) {
            if (session) await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        const deliveryLat = address.latitude != null ? Number(address.latitude) : 0;
        const deliveryLng = address.longitude != null ? Number(address.longitude) : 0;

        // Determing split groups
        const quickItems: any[] = [];
        const ecommerceItems: any[] = [];

        // Check for inventory before processing
        const productIds = items.map((i: any) => i.product.id || i.product._id);
        const productsMap = new Map((await Product.find({ _id: { $in: productIds } })).map(p => [p._id.toString(), p]));

        for (const item of items) {
            const prodId = item.product.id || item.product._id;
            const product = productsMap.get(prodId.toString());
            if (!product) throw new Error(`Product ${prodId} not found`);

            const deliveryType = item.selectedDeliveryType || (product.type === 'ecommerce' ? 'ecommerce' : 'quick');
            if (deliveryType === 'quick') quickItems.push(item);
            else ecommerceItems.push(item);
        }

        const parentOrderId = `PARENT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Implementation Step 2: Lock Inventory
        await InventoryService.lockProductStock(userId, items);

        const createdOrders: any[] = [];
        const splitConfigs = [
            { type: 'quick', items: quickItems, flow: 'auto' },
            { type: 'ecommerce', items: ecommerceItems, flow: 'courier' }
        ].filter(config => config.items.length > 0);

        for (const config of splitConfigs) {
            const newOrder = new Order({
                customer: new mongoose.Types.ObjectId(userId),
                customerName: customer.name,
                customerEmail: customer.email,
                customerPhone: customer.phone,
                deliveryAddress: {
                    address: address.address || address.street || 'N/A',
                    city: address.city || 'N/A',
                    state: address.state || '',
                    pincode: address.pincode || '000000',
                    landmark: address.landmark || '',
                    latitude: deliveryLat,
                    longitude: deliveryLng,
                },
                paymentMethod: paymentMethod || 'COD',
                paymentStatus: 'Pending',
                status: 'Pending',
                subtotal: 0,
                tax: 0,
                shipping: config.type === 'quick' ? (fees?.deliveryFee || 0) : (fees?.ecomShippingFee || 40),
                platformFee: config.type === 'quick' ? (fees?.platformFee || 0) : 0,
                discount: 0,
                total: 0,
                items: [],
                parentOrderId: parentOrderId,
                orderType: config.type,
                deliveryFlow: config.flow,
                type: 'product',
                deliveryInstructions: deliveryInstructions || '',
            });

            let calculatedSubtotal = 0;
            let totalQuantityDiscount = 0;
            const orderItemIds: mongoose.Types.ObjectId[] = [];

            for (const item of config.items) {
                const qty = Number(item.quantity) || 0;
                const product = productsMap.get((item.product.id || item.product._id).toString());
                if (!product) continue;

                const itemPrice = (product.discPrice && product.discPrice > 0) ? product.discPrice : product.price;

                // Calculate Discount
                let itemDiscountPercent = 0;
                let itemDiscountAmount = 0;
                let appliedRuleId = null;

                try {
                    const calculation = await DiscountService.calculateDiscount({
                        productId: product._id.toString(),
                        categoryId: product.category?.toString(),
                        sellerId: product.seller?.toString(),
                        quantity: qty,
                        price: itemPrice
                    });
                    itemDiscountPercent = calculation.discountPercent;
                    itemDiscountAmount = calculation.discountAmount;
                    appliedRuleId = calculation.appliedRuleId;
                } catch (err) { }

                const itemTotal = itemPrice * qty;
                calculatedSubtotal += itemTotal;
                totalQuantityDiscount += itemDiscountAmount;

                const commRate = await getOrderItemCommissionRate(product._id.toString(), product.seller.toString());
                const commAmount = (itemTotal * commRate) / 100;

                const newOrderItem = new OrderItem({
                    order: newOrder._id,
                    product: product._id,
                    seller: product.seller,
                    productName: product.productName,
                    productImage: product.mainImage,
                    sku: product.sku,
                    unitPrice: itemPrice,
                    quantity: qty,
                    total: itemTotal - itemDiscountAmount,
                    discountPercent: itemDiscountPercent,
                    discountAmount: itemDiscountAmount,
                    appliedDiscountRuleId: appliedRuleId,
                    commissionRate: commRate,
                    commissionAmount: commAmount,
                    variation: item.variant || item.variation || null,
                    deliveryType: config.type,
                    status: 'Pending'
                });

                if (session) await newOrderItem.save({ session });
                else await newOrderItem.save();
                
                orderItemIds.push(newOrderItem._id as mongoose.Types.ObjectId);
            }

            const finalTotal = calculatedSubtotal + newOrder.shipping + newOrder.platformFee - totalQuantityDiscount;
            newOrder.subtotal = Number(calculatedSubtotal.toFixed(2));
            newOrder.discount = Number(totalQuantityDiscount.toFixed(2));
            newOrder.total = Number(finalTotal.toFixed(2));
            newOrder.items = orderItemIds;

            if (session) await newOrder.save({ session });
            else await newOrder.save();

            createdOrders.push(newOrder);
        }

        if (session) await session.commitTransaction();

        // Trigger notifications for the first order if it's COD
        if (paymentMethod === 'COD') {
            for (const order of createdOrders) {
                try {
                    const io = req.app.get("io");
                    if (io) {
                        const savedOrder = await Order.findById(order._id).lean();
                        if (savedOrder) await notifySellersOfOrderUpdate(io, savedOrder, 'NEW_ORDER');
                    }
                    await sendNotification('Customer', userId, 'Order Placed!', `Your ${order.orderType} order ${order.orderNumber} is placed.`, { type: 'Order', link: `/orders/${order._id}` });
                } catch (e) { }
            }
        }

        return res.status(201).json({
            success: true,
            message: createdOrders.length > 1 ? "Your items will be delivered in multiple shipments" : "Order placed successfully",
            data: {
                parentOrderId: parentOrderId,
                orders: createdOrders,
                primaryOrderId: createdOrders[0]._id // For backward compatibility with PhonePe trigger
            },
        });

    } catch (error: any) {
        if (session) await session.abortTransaction().catch(err => console.error("Abort failed", err));
        console.error("Order Creation Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Error creating order",
        });
    } finally {
        if (session) session.endSession();
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

        const customer = await Customer.findById(userId).select('deliveryOtp');
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
