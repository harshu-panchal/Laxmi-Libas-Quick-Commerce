import { Request, Response } from "express";
import Order from "../../../models/Order";
import OrderItem from "../../../models/OrderItem";
import { asyncHandler } from "../../../utils/asyncHandler";
import Seller from "../../../models/Seller";
import WalletTransaction from "../../../models/WalletTransaction";
import { notifyDeliveryBoysOfNewOrder } from "../../../services/orderNotificationService";
import { Server as SocketIOServer } from "socket.io";
import { DelhiveryService } from "../../../services/shipping/DelhiveryService";


/**
 * Get seller's orders with filters, sorting, and pagination
 */
export const getOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const {
      dateFrom,
      dateTo,
      status,
      search,
      page = "1",
      limit = "10",
      sortBy = "orderDate",
      sortOrder = "desc",
    } = req.query;

    // Find all order IDs that contain items from this seller
    const orderItems = await OrderItem.find({ seller: sellerId }).distinct("order");

    // Build query - filter by orders containing this seller's items
    const query: any = { 
      _id: { $in: orderItems },
      $or: [
        { paymentStatus: "Paid" },
        { paymentMethod: "COD" }
      ]
    };

    // Date range filter
    if (dateFrom || dateTo) {
      query.orderDate = {};
      if (dateFrom) {
        query.orderDate.$gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        query.orderDate.$lte = new Date(dateTo as string);
      }
    }
    // Status filter
    if (status && status !== 'All Status') {
      // Map frontend status to backend status
      const statusMapping: Record<string, string> = {
        'Pending': 'Pending',
        'Accepted': 'Accepted',
        'On the way': 'On the way',
        'Out For Delivery': 'Out for Delivery',
        'Delivered': 'Delivered',
        'Cancelled': 'Cancelled',
        'Rejected': 'Rejected',
      };
      query.status = statusMapping[status as string] || status;
    }
    // Tab Filter (Backend filtering for orderType)
    const { orderType } = req.query;
    if (orderType && ['quick', 'ecommerce'].includes(orderType as string)) {
      query.orderType = orderType;
    }
    // Search filter
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { invoiceNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort: any = {};
    sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    // Get orders with populated customer and delivery info
    const orders = await Order.find(query)
      .populate("customer", "name email phone")
      .populate("deliveryBoy", "name mobile")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Order.countDocuments(query);

    // Format response for frontend
    const formattedOrders = orders.map(order => ({
      id: order._id,
      orderId: order.orderNumber,
      deliveryDate: order.estimatedDeliveryDate
        ? order.estimatedDeliveryDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
        : order.orderDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      orderDate: order.orderDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      status: order.status === 'On the way' ? 'Out for Delivery' : order.status,
      amount: order.total,
      customerName: (order.customer as any)?.name || order.customerName || '',
      customerPhone: (order.customer as any)?.phone || order.customerPhone || '',
      deliveryBoyName: (order.deliveryBoy as any)?.name || '',
      orderType: order.orderType || 'quick',
    }));

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: formattedOrders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  }
);

/**
 * Get order by ID with populated order items, customer, and delivery info
 */
export const getOrderById = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;

    // Get order with populated data checking either _id or orderNumber
    const orderQuery = id.startsWith('ORD') ? { orderNumber: id } : { _id: id };
    const order = await Order.findOne({
      ...orderQuery,
      $or: [
        { paymentStatus: "Paid" },
        { paymentMethod: "COD" }
      ]
    })
      .populate("customer", "name email phone")
      .populate("deliveryBoy", "name mobile email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not yet confirmed",
      });
    }

    // First check if this seller has items in this order
    const sellerItems = await OrderItem.find({ order: order._id, seller: sellerId })
      .populate("seller", "storeName")
      .populate("product", "productName mainImage pack");

    if (!sellerItems || sellerItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found or no items belong to you",
      });
    }

    // Get only this seller's order items
    const orderItems = sellerItems;

    const sellerSubtotal = orderItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const orderSubtotal = order.subtotal || sellerSubtotal || 0;
    const sellerTaxTotal =
      orderSubtotal > 0 ? Number((((order.tax || 0) * sellerSubtotal) / orderSubtotal).toFixed(2)) : 0;

    // Format order items for frontend
    const formattedItems = orderItems.map(item => {
      const itemSubtotal = item.total || 0;
      const itemTax =
        sellerSubtotal > 0 ? Number(((sellerTaxTotal * itemSubtotal) / sellerSubtotal).toFixed(2)) : 0;
      const populatedProduct = item.product as any;

      return {
        srNo: item._id.toString().slice(-4), // Use last 4 chars of ID as srNo
        product: item.productName || populatedProduct?.productName || 'Unknown Product',
        productImage: item.productImage || populatedProduct?.mainImage || '',
        soldBy: (item.seller as any)?.storeName || 'N/A',
        unit: item.variantTitle || item.variation || populatedProduct?.pack || 'N/A',
        size: item.selectedVariant?.size || '-',
        color: item.selectedVariant?.color || '-',
        price: item.unitPrice || 0,
        tax: itemTax,
        taxPercent: itemSubtotal > 0 ? Number(((itemTax / itemSubtotal) * 100).toFixed(2)) : 0,
        qty: item.quantity || 0,
        subtotal: itemSubtotal,
      };
    });

    // Format order data for frontend
    const orderDetail = {
      id: order._id,
      invoiceNumber: order.invoiceNumber || `INV-${order.orderNumber}-${String(sellerId).slice(-4)}`,
      orderDate: order.orderDate ? order.orderDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      deliveryDate: order.estimatedDeliveryDate ? order.estimatedDeliveryDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      timeSlot: order.timeSlot || 'N/A',
      status: order.status === 'On the way' ? 'Out for Delivery' : order.status,
      customerName: (order.customer as any)?.name || order.customerName || '',
      customerEmail: (order.customer as any)?.email || order.customerEmail || '',
      customerPhone: (order.customer as any)?.phone || order.customerPhone || '',
      deliveryBoyName: (order.deliveryBoy as any)?.name || '',
      deliveryBoyPhone: (order.deliveryBoy as any)?.mobile || '',
      items: formattedItems,
      subtotal: sellerSubtotal,
      tax: sellerTaxTotal,
      grandTotal: Number((sellerSubtotal + sellerTaxTotal).toFixed(2)),
      orderType: order.orderType || 'quick',
      deliveryFlow: order.deliveryFlow || 'auto',
      courierPartner: order.courierPartner || '',
      trackingId: order.trackingId || '',
      paymentMethod: order.paymentMethod || 'N/A',
      paymentStatus: order.paymentStatus || 'Pending',
      deliveryAddress: order.deliveryAddress || {},
    };

    return res.status(200).json({
      success: true,
      message: "Order details fetched successfully",
      data: orderDetail,
    });
  }
);

/**
 * Update order status (seller can update: Accepted, On the way, Delivered, Cancelled)
 */
export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;
    const { status } = req.body;

    // Validate allowed status updates for seller
    const allowedStatuses = ['Accepted', 'Packed', 'Shipped', 'On the way', 'Delivered', 'Cancelled', 'Rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Seller can only update to: ${allowedStatuses.join(', ')}`,
      });
    }

    // Check if this seller has items in this order
    console.log(`🔍 [Seller Order Update] Seller ${sellerId} attempting to update Order ${id} to ${status}`);
    const sellerItems = await OrderItem.findOne({ order: id, seller: sellerId });

    if (!sellerItems) {
      console.warn(`❌ [Seller Order Update] Unauthorized: Seller ${sellerId} has no items in Order ${id}`);
      return res.status(404).json({
        success: false,
        message: "Order not found or you are not authorized to manage this order",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      console.warn(`❌ [Seller Order Update] Order Not Found: ${id}`);
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if status is already the same
    // Check if status is already the same (Allow re-triggering Accepted status for notifications)
    if (order.status === status && status !== 'Accepted') {
      console.log(`ℹ️ [Seller Order Update] Status already ${status} for Order ${id}`);
      return res.status(400).json({
        success: false,
        message: `Order is already ${status}`,
      });
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    // Trigger delivery notification if seller accepts the order
    // Trigger delivery notification if seller accepts a QUICK order
    if (status === 'Accepted' && order.orderType !== 'ecommerce') {
      try {
        const io: SocketIOServer = (req.app.get("io") as SocketIOServer);
        if (io) {
          // Need to fetch full order with details for the notification service
          // Using lean() to get a plain JS object which is what the service expects mostly,
          // but checking the service implementation, it uses .items mainly for seller location.
          // We should ensure the passed order object has populated items with sellers.
          const fullOrder = await Order.findById(order._id)
            .populate({
              path: 'items',
              populate: { path: 'seller' }
            })
            .lean();

          if (fullOrder) {
            // Automatic Assignment Mode: Always notify delivery boys on seller acceptance
            await notifyDeliveryBoysOfNewOrder(io, fullOrder);
            console.log(`Automatic delivery notification triggered for Accepted order ${order.orderNumber}`);
          }
        }
      } catch (notifyError) {
        console.error('Error notifying delivery boys on seller acceptance:', notifyError);
        // Don't fail the request, just log
      }
    }

    // If order is delivered, credit seller's balance
    if (status === 'Delivered' && previousStatus !== 'Delivered') {
      const seller = await Seller.findById(sellerId);
      if (seller) {
        // Calculate net earning (sale amount - commission)
        // Commission is stored in seller model
        const commissionRate = (seller.commission || 0) / 100;
        const commissionAmount = order.total * commissionRate;
        const netEarning = order.total - commissionAmount;

        seller.balance = (seller.balance || 0) + netEarning;
        await seller.save();

        // Log transaction
        await WalletTransaction.create({
          sellerId,
          amount: netEarning,
          type: 'Credit',
          description: `Earnings from Order #${order.orderNumber}`,
          reference: `ORD-${order.orderNumber}-${Date.now()}`,
          status: 'Completed'
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: {
        id: order._id,
        status: order.status,
      },
    });
  }
);

/**
 * Ship order (For Ecommerce flow)
 * Generates tracking ID and sets status to Shipped
 */
export const shipOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;
    const { courierPartner } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Authorization check
    const sellerItem = await OrderItem.findOne({ order: id, seller: sellerId });
    if (!sellerItem) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (order.status !== 'Packed' && order.status !== 'Accepted') {
      return res.status(400).json({
        success: false,
        message: "Order must be in Packed or Accepted state to ship"
      });
    }

    // Generation of dummy tracking ID
    const trackingId = `TRK${Date.now()}${Math.floor(Math.random() * 1000)}`;

    order.status = 'Shipped';
    order.trackingId = trackingId;
    order.courierPartner = courierPartner || 'Standard Courier';
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order marked as shipped",
      data: {
        id: order._id,
        status: order.status,
        trackingId: order.trackingId,
        courierPartner: order.courierPartner
      }
    });
  }
);

/**
 * Mark order as Packed
 */
export const markAsPacked = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Auth check
    const sellerItem = await OrderItem.findOne({ order: id, seller: sellerId });
    if (!sellerItem) return res.status(403).json({ success: false, message: "Unauthorized" });

    if (order.status !== 'Accepted') {
      return res.status(400).json({ success: false, message: "Only Accepted orders can be marked as Packed" });
    }

    order.status = 'Packed';

    // 🚀 AUTO COURIER TRIGGER (For Ecommerce Flow)
    if (order.orderType === 'ecommerce') {
      try {
        console.log(`[CourierAuto] Triggering shipment for Order ${order.orderNumber}`);
        const courierResponse = await DelhiveryService.createShipmentFromOrder(order);
        
        if (courierResponse && courierResponse.success !== false) {
           // Delhivery returns waybills in shipments array
           const waybill = courierResponse.packages?.[0]?.waybill || 
                           courierResponse.shipments?.[0]?.waybill;
           
           if (waybill) {
               order.status = 'Shipped';
               order.trackingId = waybill;
               order.courierPartner = 'Delhivery';
               order.trackingStatus = 'SHIPPED';
               console.log(`[CourierAuto] Order ${order.orderNumber} automatically SHIPPED with Waybill: ${waybill}`);
           }
        }
      } catch (courierError: any) {
        console.error(`[CourierAuto] Failed to auto-assign courier for Order ${order.orderNumber}:`, courierError.message);
        // We don't fail the "Packed" action, but the order remains in "Packed" status for manual retry
      }
    }

    await order.save();

    return res.status(200).json({ success: true, message: "Order marked as Packed", data: { status: order.status } });
  }
);

/**
 * Mark order as Ready for Pickup
 */
export const readyForPickup = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Auth check
    const sellerItem = await OrderItem.findOne({ order: id, seller: sellerId });
    if (!sellerItem) return res.status(403).json({ success: false, message: "Unauthorized" });

    // For quick commerce, status might go from Received -> Accepted -> Ready for Pickup
    // For ecommerce, status might go from Packed -> Ready for Pickup
    const allowed = ['Packed', 'Accepted'];
    if (!allowed.includes(order.status)) {
      return res.status(400).json({ success: false, message: "Order must be Packed or Accepted to be Ready for Pickup" });
    }

    order.status = 'Ready for pickup';
    await order.save();

    return res.status(200).json({ success: true, message: "Order marked as Ready for Pickup", data: { status: order.status } });
  }
);

/**
 * Get Invoice Data
 */
export const printInvoice = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;

    const order = await Order.findById(id).populate('customer').populate({
      path: 'items',
      match: { seller: sellerId },
      populate: { path: 'product' }
    });

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const seller = await Seller.findById(sellerId);

    // Return structured data for the frontend to render the invoice
    return res.status(200).json({
      success: true,
      data: {
        invoiceNumber: order.invoiceNumber || `INV-${order.orderNumber}`,
        orderDate: order.orderDate,
        customer: {
          name: order.customerName,
          address: order.deliveryAddress,
          phone: order.customerPhone,
        },
        seller: {
          storeName: seller?.storeName,
          address: seller?.address,
          gstin: (seller as any)?.gstin || 'N/A',
        },
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total
      }
    });
  }
);

/**
 * Get Shipping Label Data
 */
export const printLabel = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const seller = await Seller.findById(sellerId);

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.orderNumber,
        trackingId: order.trackingId || 'PENDING',
        courier: order.courierPartner || 'TBA',
        recipient: {
          name: order.customerName,
          address: order.deliveryAddress,
          phone: order.customerPhone,
        },
        sender: {
          name: seller?.storeName,
          address: seller?.address,
        },
        orderType: order.orderType,
        weight: '1kg' // Placeholder
      }
    });
  }
);
