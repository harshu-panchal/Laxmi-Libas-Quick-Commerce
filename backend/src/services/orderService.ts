import mongoose from "mongoose";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import Product from "../models/Product";
import Customer from "../models/Customer";
import Seller from "../models/Seller";
import { DiscountService } from "./discountService";
import { getOrderItemCommissionRate } from "./commissionService";
import { InventoryService } from "./inventoryService";
import { notifySellersOfOrderUpdate } from "./sellerNotificationService";
import { sendNotification } from "./notificationService";
import { Server as SocketIOServer } from "socket.io";

export const finalizeOrderCreation = async (
  userId: string,
  orderData: any,
  io?: SocketIOServer,
  paymentStatus: "Pending" | "Paid" = "Pending"
) => {
  let session: mongoose.ClientSession | null = null;
  try {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (sessionError) {
      session = null;
    }

    const { items, address, paymentMethod, fees, deliveryInstructions, tip } = orderData;

    // Fetch customer details
    const customer = await Customer.findById(userId);
    if (!customer) throw new Error("Customer not found");

    const deliveryLat = address.latitude != null ? Number(address.latitude) : 0;
    const deliveryLng = address.longitude != null ? Number(address.longitude) : 0;

    // Fetch products
    const productIds = items.map((i: any) => i.product.id || i.product._id);
    const productsMap = new Map((await Product.find({ _id: { $in: productIds } })).map(p => [p._id.toString(), p]));

    const normalizeCity = (city: string) => city.toLowerCase().trim().replace(/\s+/g, '');
    const quickItems: any[] = [];
    const ecommerceItems: any[] = [];

    for (const item of items) {
      const prodId = item.product.id || item.product._id;
      const product = productsMap.get(prodId.toString());
      if (!product) throw new Error(`Product ${prodId} not found`);

      const seller = await Seller.findById(product.seller).select('city');
      const sellerCity = seller?.city ? normalizeCity(seller.city) : '';
      const customerCity = address.city ? normalizeCity(address.city) : '';

      let decidedType: string = item.selectedDeliveryType || 'quick';
      if (decidedType === 'ecommerce') decidedType = 'standard';
      if (decidedType === 'quick' && sellerCity && customerCity && sellerCity !== customerCity) {
        decidedType = 'standard';
      }
      
      if (decidedType === 'quick') quickItems.push(item);
      else ecommerceItems.push(item);
    }

    const parentOrderId = `PARENT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Inventory lock was already done during preparation, or we do it now
    // For online payment, we might want to confirm the lock
    await InventoryService.lockProductStock(userId, items);

    const createdOrders: any[] = [];
    const splitConfigs = [
      { type: 'quick', items: quickItems, flow: 'instant' },
      { type: 'standard', items: ecommerceItems, flow: 'courier' }
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
        paymentStatus: paymentStatus,
        status: paymentStatus === 'Paid' ? 'Received' : 'Pending',
        subtotal: 0,
        tax: 0,
        shipping: config.type === 'quick' ? (fees?.deliveryFee || 0) : (fees?.ecomShippingFee || 40),
        platformFee: config.type === 'quick' ? (fees?.platformFee || 0) : 0,
        discount: 0,
        total: 0,
        items: [],
        parentOrderId: parentOrderId,
        orderType: config.type as 'quick' | 'standard',
        deliveryType: config.flow as 'instant' | 'courier',
        type: 'product',
        deliveryInstructions: deliveryInstructions || '',
        tip: tip || 0,
      });

      let calculatedSubtotal = 0;
      let totalQuantityDiscount = 0;
      const orderItemIds: mongoose.Types.ObjectId[] = [];

      for (const item of config.items) {
        const qty = Number(item.quantity) || 0;
        const product = productsMap.get((item.product.id || item.product._id).toString());
        if (!product) continue;

        const itemPrice = (product.discPrice && product.discPrice > 0) ? product.discPrice : product.price;

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
          status: paymentStatus === 'Paid' ? 'Received' : 'Pending'
        });

        if (session) await newOrderItem.save({ session });
        else await newOrderItem.save();
        
        orderItemIds.push(newOrderItem._id as mongoose.Types.ObjectId);
      }

      const finalTotal = calculatedSubtotal + newOrder.shipping + newOrder.platformFee - totalQuantityDiscount + (tip || 0);
      newOrder.subtotal = Number(calculatedSubtotal.toFixed(2));
      newOrder.discount = Number(totalQuantityDiscount.toFixed(2));
      newOrder.total = Number(finalTotal.toFixed(2));
      newOrder.items = orderItemIds;

      if (session) await newOrder.save({ session });
      else await newOrder.save();

      createdOrders.push(newOrder);
    }

    if (session) await session.commitTransaction();

    // Trigger notifications if Paid or COD
    if (paymentStatus === 'Paid' || paymentMethod === 'COD') {
      const { autoAssignDeliveryBoy } = await import("./autoAssignmentService");
      
      for (const order of createdOrders) {
        try {
          if (io) {
            const savedOrder = await Order.findById(order._id).lean();
            if (savedOrder) {
               await notifySellersOfOrderUpdate(io, savedOrder, 'NEW_ORDER');
               
               // Auto-assign if quick
               if (order.orderType === 'quick') {
                 await autoAssignDeliveryBoy(order._id.toString(), io);
               }
            }
          }
          await sendNotification('Customer', userId, 'Order Placed!', `Your ${order.orderType} order ${order.orderNumber} is placed.`, { type: 'Order', link: `/orders/${order._id}` });
        } catch (e) { }
      }
    }

    return createdOrders;

  } catch (error: any) {
    if (session) await session.abortTransaction();
    throw error;
  } finally {
    if (session) session.endSession();
  }
};
