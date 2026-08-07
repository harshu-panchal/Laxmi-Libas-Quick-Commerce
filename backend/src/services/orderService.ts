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
import { sendNotification, sendBroadcastNotification } from "./notificationService";
import { Server as SocketIOServer } from "socket.io";
import AppSettings from "../models/AppSettings";
import { calculateCustomerDeliveryFee } from "./deliveryFeeService";

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

      // Determine order type based on product configuration: [v2 - city check removed for explicit quick products]
      // RULE 1: If product is explicitly marked as 'quick' or 'both', ALWAYS treat as quick
      //         (seller listed it as quick-deliverable, city check is NOT required)
      // RULE 2: If product.deliveryType is 'quick' but product.type is not explicitly set,
      //         use city match as a secondary gating check
      // RULE 3: Frontend explicit override takes priority
      let decidedType = 'ecommerce';

      // Frontend explicit override (highest priority)
      if (item.selectedDeliveryType === 'ecommerce' || item.selectedDeliveryType === 'standard') {
        decidedType = 'ecommerce';
      } else if (item.selectedDeliveryType === 'quick') {
        // Frontend says quick → trust it
        decidedType = 'quick';
      } else if (product.type === 'quick' || product.type === 'both') {
        // Product is explicitly listed as quick/both → ALWAYS quick, no city check required
        decidedType = 'quick';
        console.log(`[OrderType] Product ${product.productName} is type=${product.type} → quick order (no city check needed)`);
      } else if (product.deliveryType === 'quick') {
        // Auto-detect via deliveryType: use city proximity check
        if (sellerCity && customerCity && sellerCity === customerCity) {
          decidedType = 'quick';
          console.log(`[OrderType] Product ${product.productName} deliveryType=quick, cities match (${sellerCity}) → quick order`);
        } else {
          console.log(`[OrderType] Product ${product.productName} deliveryType=quick but city mismatch (seller: ${sellerCity || 'N/A'}, customer: ${customerCity || 'N/A'}) → ecommerce`);
        }
      }
      
      if (decidedType === 'quick') quickItems.push(item);
      else ecommerceItems.push(item);
    }

    const parentOrderId = `PARENT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // For COD, lock stock now. For Online, it was locked during PaymentIntent creation.
    if (paymentMethod === 'COD') {
        await InventoryService.lockProductStock(userId, items);
    }

    const createdOrders: any[] = [];
    const splitConfigs = [
      { type: 'quick', items: quickItems, flow: 'instant' },
      { type: 'ecommerce', items: ecommerceItems, flow: 'courier' }
    ].filter(config => config.items.length > 0);

    // Server-side delivery fee (ignore inflated client values e.g. old 500 cap)
    let orderSubtotalForFees = 0;
    const feeLineItems: { product: { seller: unknown } }[] = [];
    for (const item of items) {
      const product = productsMap.get((item.product.id || item.product._id).toString());
      if (!product) continue;
      feeLineItems.push({ product: { seller: product.seller } });
      let itemPrice = (product.discPrice && product.discPrice > 0) ? product.discPrice : product.price;
      orderSubtotalForFees += itemPrice * (Number(item.quantity) || 1);
    }

    const serverFees = await calculateCustomerDeliveryFee(
      orderSubtotalForFees,
      feeLineItems,
      deliveryLat || null,
      deliveryLng || null
    );
    const appSettings = await AppSettings.getSettings();
    const serverQuickDeliveryFee = serverFees.estimatedDeliveryFee;
    const serverPlatformFee = serverFees.platformFee ?? fees?.platformFee ?? 0;
    const serverEcomShippingFee =
      (serverFees.freeDeliveryThreshold > 0 && orderSubtotalForFees >= serverFees.freeDeliveryThreshold) || quickItems.length > 0
        ? 0
        : appSettings.deliveryCharges || 0;

    for (const config of splitConfigs) {
      // Smart Delivery Estimation
      let estimatedDeliveryDateValue: Date = new Date();
      let estimatedDeliveryTimeValue: string = "";

      if (config.type === 'quick') {
        estimatedDeliveryDateValue = new Date();
        estimatedDeliveryTimeValue = "30-45 mins";
      } else {
        const pincode = address.pincode || '000000';
        const daysToAdd = 2 + (parseInt(pincode.charAt(0)) % 4);
        estimatedDeliveryDateValue = new Date();
        estimatedDeliveryDateValue.setDate(estimatedDeliveryDateValue.getDate() + daysToAdd);
        estimatedDeliveryTimeValue = `by 7:00 PM (Arriving in ${daysToAdd} days)`;
      }

      // Fraud & Abuse Risk Detection
      let isFlaggedFraudValue = false;
      let fraudCheckScoreValue = 0;
      try {
        const previousOrders = await Order.find({ customer: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(10);
        const failedOrdersCount = previousOrders.filter(o => o.status === 'Cancelled' || o.paymentStatus === 'Failed').length;
        if (failedOrdersCount >= 4) {
          isFlaggedFraudValue = true;
          fraudCheckScoreValue = 85; // High Risk Alert
        } else if (failedOrdersCount >= 2) {
          fraudCheckScoreValue = 45; // Moderate Risk
        }
      } catch (err) {}

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
        status: 'Received',
        subtotal: 0,
        tax: 0,
        shipping: config.type === 'quick' ? serverQuickDeliveryFee : serverEcomShippingFee,
        platformFee: config.type === 'quick' ? serverPlatformFee : 0,
        discount: 0,
        total: 0,
        items: [],
        parentOrderId: parentOrderId,
        orderType: config.type as 'quick' | 'ecommerce',
        deliveryType: config.flow as 'instant' | 'courier',
        deliveryFlow: config.type === 'quick' ? 'auto' : 'courier',
        type: 'product',
        deliveryInstructions: deliveryInstructions || '',
        tip: tip || 0,
        transactionId: orderData.transactionId,
        merchantOrderId: orderData.merchantOrderId,
        estimatedDeliveryDate: estimatedDeliveryDateValue,
        estimatedDeliveryTime: estimatedDeliveryTimeValue,
        isFlaggedFraud: isFlaggedFraudValue,
        fraudCheckScore: fraudCheckScoreValue,
      });

      let calculatedSubtotal = 0;
      let totalQuantityDiscount = 0;
      const orderItemIds: mongoose.Types.ObjectId[] = [];

      for (const item of config.items) {
        const qty = Number(item.quantity) || 0;
        const product = productsMap.get((item.product.id || item.product._id).toString());
        if (!product) continue;

        const variantValue = item.variant || item.variation || null;
        let itemPrice = (product.discPrice && product.discPrice > 0) ? product.discPrice : product.price;

        if (variantValue && product.variations && product.variations.length > 0) {
          const variant = product.variations.find((v: any) => 
            v._id?.toString() === variantValue || 
            v.title === variantValue || 
            v.value === variantValue || 
            v.name === variantValue
          );
          if (variant) {
            itemPrice = (variant.discPrice && variant.discPrice > 0) ? variant.discPrice : variant.price;
          }
        }

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

        // Find variant details for accurate size/color recording
        let variantDetails: any = null;
        if (variantValue && product.variations && product.variations.length > 0) {
          variantDetails = product.variations.find((v: any) => 
            v._id?.toString() === variantValue || 
            v.title === variantValue || 
            v.value === variantValue || 
            v.name === variantValue
          );
        }

        const variantTitle = variantDetails 
          ? (variantDetails.title || variantDetails.value || variantDetails.name) 
          : (variantValue && variantValue !== product._id?.toString() ? variantValue : null);

        const selectedVariant = item.selectedVariant || (variantDetails ? {
          size: variantDetails.title || variantDetails.value || variantDetails.name,
          color: product.color || null
        } : (variantTitle ? { size: variantTitle, color: product.color || null } : null));

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
          variation: variantValue,
          variantTitle: variantTitle,
          selectedVariant: selectedVariant,
          deliveryType: config.type,
          status: 'Received'
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

    // Notify sellers when order is placed (Paid or COD). Delivery is notified only after seller accepts.
    if (paymentStatus === 'Paid' || paymentMethod === 'COD') {
      for (const order of createdOrders) {
        try {
          if (io) {
            const fullOrder = await Order.findById(order._id)
              .populate({ path: 'items', populate: { path: 'seller' } })
              .lean();

            if (fullOrder) {
              await notifySellersOfOrderUpdate(io, fullOrder, 'NEW_ORDER');
              console.log(`[OrderService] Seller NEW_ORDER notification sent for ${order.orderNumber}`);
            }
          }
          await sendNotification('Customer', userId, 'Order Placed!', `Your ${order.orderType} order ${order.orderNumber} is placed.`, { type: 'Order', link: `/orders/${order._id}` });
          await sendBroadcastNotification('Admin', 'New Order Received!', `Order ${order.orderNumber} has been placed.`, { type: 'Order', link: `/orders/${order._id}`, priority: 'High' });
        } catch (e) {
          console.error(`[OrderService] Post-order notification failed for ${order.orderNumber}:`, e);
        }
      }
    }

    // Finalize inventory (convert locks to actual stock deductions)
    try {
        await InventoryService.confirmProductLocks(userId);
    } catch (invErr) {
        console.warn('[OrderService] Inventory confirmation warning:', (invErr as any).message);
    }

    return createdOrders;

  } catch (error: any) {
    if (session) await session.abortTransaction();
    throw error;
  } finally {
    if (session) session.endSession();
  }
};

/**
 * Stub: Handles financial state transitions when order status changes (e.g. Delivered → commission distribution).
 * Extend this function with actual logic as needed.
 */
export async function processOrderStatusTransition(orderId: string, newStatus: string, previousStatus: string): Promise<void> {
    console.log(`[orderService] Status transition: ${previousStatus} → ${newStatus} for order ${orderId}`);
}
