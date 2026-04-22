import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import Order from "../../../models/Order";
import OrderItem from "../../../models/OrderItem";
import Delivery from "../../../models/Delivery";
import DeliveryAssignment from "../../../models/DeliveryAssignment";
import Return from "../../../models/Return";
import Seller from "../../../models/Seller"; // Added Seller model
import { notifySellersOfOrderUpdate } from "../../../services/sellerNotificationService";
import { Server as SocketIOServer } from "socket.io";
import { calculateEstimatedDeliveryBoyEarning } from "../../../services/orderNotificationService";
import { DelhiveryService } from "../../../services/shipping/DelhiveryService"; // Added DelhiveryService

/**
 * Get all orders with filters
 */
export const getAllOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      seller,
      dateFrom,
      dateTo,
      search,
      type,
      orderType,
    } = req.query;

    const query: any = {};

    if (type) query.type = type;
    if (orderType) query.orderType = orderType;
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (dateFrom || dateTo) {
      query.orderDate = {};
      if (dateFrom) query.orderDate.$gte = new Date(dateFrom as string);
      if (dateTo) query.orderDate.$lte = new Date(dateTo as string);
    }
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search as string, $options: "i" } },
        { customerName: { $regex: search as string, $options: "i" } },
        { customerEmail: { $regex: search as string, $options: "i" } },
        { customerPhone: { $regex: search as string, $options: "i" } },
      ];
    }

    // If seller filter, need to check order items
    if (seller) {
      const orderItems = await OrderItem.find({ seller }).distinct("order");
      query._id = { $in: orderItems };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("customer", "name email phone")
        .populate("deliveryBoy", "name mobile")
        .populate("items")
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      Order.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  }
);

/**
 * Get order by ID
 */
export const getOrderById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("customer", "name email phone")
      .populate("deliveryBoy", "name mobile email")
      .populate({
        path: "items",
        populate: [
          {
            path: "product",
            select: "productName mainImage",
          },
          {
            path: "seller",
            select: "sellerName storeName",
          },
        ],
      })
      .populate("cancelledBy", "firstName lastName");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: order,
    });
  }
);

/**
 * Update order status
 */
export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = [
      "Received",
      "Pending",
      "Processed",
      "Packed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Rejected",
      "Returned",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const updateData: any = { status };
    if (adminNotes) updateData.adminNotes = adminNotes;

    if (status === "Delivered") {
      updateData.deliveredAt = new Date();
    }

    if (status === "Cancelled") {
      updateData.cancelledAt = new Date();
      updateData.cancelledBy = req.user?.userId;
    }

    const order = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("customer", "name email phone")
      .populate("deliveryBoy", "name mobile")
      .populate("items");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }


    // Trigger notification if status is "Processed" (Confirmed) or if paymentStatus changed to "Paid"
    if (status === "Processed" || order.paymentStatus === "Paid") {
      const io: SocketIOServer = req.app.get("io");
      if (io) {
        notifySellersOfOrderUpdate(io, order, "STATUS_UPDATE");
      }
    }

    // Distribute commissions if order is delivered
    if (status === "Delivered") {
      const { distributeCommissions } = await import("../../../services/commissionService");
      try {
        await distributeCommissions(id);
      } catch (error) {
        console.error("Error distributing commissions:", error);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  }
);

/**
 * Update order tracking info (Ecommerce only)
 */
export const updateOrderTracking = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { courierPartner, trackingId, status } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.orderType !== 'ecommerce') {
      return res.status(400).json({
        success: false,
        message: "Tracking info can only be updated for ecommerce orders",
      });
    }

    if (courierPartner) order.courierPartner = courierPartner;
    if (trackingId) order.trackingId = trackingId;
    if (status) order.status = status;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order tracking info updated successfully",
      data: order,
    });
  }
);

/**
 * Generate Delhivery shipping label (Waybill)
 */
export const generateCourierLabel = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await Order.findById(id).populate('items');

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.orderType !== 'ecommerce') {
      return res.status(400).json({ success: false, message: "Only ecommerce orders support courier labels" });
    }

    // Get seller info for pickup location (Assuming single seller order or using primary seller)
    const firstItem = await OrderItem.findById(order.items[0]).populate('seller');
    if (!firstItem || !firstItem.seller) {
       return res.status(400).json({ success: false, message: "Seller information not found for this order" });
    }

    const seller = firstItem.seller as any;

    try {
      const delhiveryParams = {
        orderNumber: order.orderNumber,
        add: order.deliveryAddress.address,
        phone: order.customerPhone,
        payment_mode: order.paymentMethod === 'COD' ? 'COD' as const : 'Prepaid' as const,
        name: order.customerName,
        pin: order.deliveryAddress.pincode,
        sellerName: seller.storeName || seller.sellerName,
        sellerAddress: seller.address || "Pickup Point",
        sellerPhone: seller.mobile,
        sellerCity: seller.city || "City",
        sellerPin: seller.businessDetails?.pincode || "452001", // Fallback pin
        weight: 0.5, // Default weight 0.5kg
        totalAmount: order.total
      };

      const result = await DelhiveryService.createShipment(delhiveryParams);

      if (result.success && result.packages && result.packages.length > 0) {
        order.trackingId = result.packages[0].waybill;
        order.courierPartner = 'Delhivery';
        order.status = 'Shipped';
        await order.save();

        return res.status(200).json({
          success: true,
          message: "Delhivery label generated successfully",
          awb: order.trackingId,
          data: result
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Failed to generate label from Delhivery",
          details: result
        });
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Delhivery API Error",
        error: error.message
      });
    }
  }
);

/**
 * Fetch live tracking from Delhivery
 */
export const trackCourierOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order || !order.trackingId) {
      return res.status(404).json({ success: false, message: "Order or tracking ID not found" });
    }

    try {
      const trackingInfo = await DelhiveryService.trackShipment(order.trackingId);
      return res.status(200).json({
        success: true,
        data: trackingInfo
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch tracking data",
        error: error.message
      });
    }
  }
);


/**
 * Assign delivery boy to order
 */
export const assignDeliveryBoy = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { deliveryBoyId } = req.body;
    const adminUserId = req.user?.userId;

    if (!deliveryBoyId) {
      return res.status(400).json({
        success: false,
        message: "Delivery boy ID is required",
      });
    }

    if (!adminUserId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication is required",
      });
    }

    // Verify delivery boy exists and is active
    const deliveryBoy = await Delivery.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,
        message: "Delivery boy not found",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update order
    order.deliveryBoy = deliveryBoyId as any;
    order.deliveryBoyStatus = "Assigned";
    order.assignedAt = new Date();
    await order.save();

    // Create or update delivery assignment
    await DeliveryAssignment.findOneAndUpdate(
      { order: id },
      {
        order: id,
        deliveryBoy: deliveryBoyId,
        assignedAt: new Date(),
        assignedBy: adminUserId,
        status: "Assigned",
      },
      { upsert: true, new: true }
    );

    const updatedOrder = await Order.findById(id)
      .populate("customer", "name email phone")
      .populate("deliveryBoy", "name mobile email")
      .populate("items");
    
    // Notify Seller and Delivery Boy via Socket
    if (updatedOrder) {
      const io: any = (req.app as any).get("io");
      if (io) {
        // Calculate estimated delivery boy earning
        const earning = await calculateEstimatedDeliveryBoyEarning(updatedOrder);
        const orderWithEarning = {
          ...updatedOrder.toObject(),
          deliveryBoyEarning: earning
        };

        // Notify Delivery Boy
        io.to(`delivery-${deliveryBoyId}`).emit("order-assigned", {
          orderId: id,
          orderNumber: updatedOrder.orderNumber,
          message: "A new order has been assigned to you",
          order: orderWithEarning
        });

        // Notify Sellers (Optional but helpful to refresh their order view)
        notifySellersOfOrderUpdate(io, updatedOrder, "STATUS_UPDATE");
        
        // Also emit to specific order room to update tracking/detail pages
        io.to(`order-${id}`).emit("delivery-assigned", {
          orderId: id,
          deliveryBoy: updatedOrder.deliveryBoy,
          message: "Delivery partner assigned"
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Delivery boy assigned successfully",
      data: updatedOrder,
    });
  }
);

/**
 * Get orders by status
 */
export const getOrdersByStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const validStatuses = [
      "Received",
      "Pending",
      "Processed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Rejected",
      "Returned",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [orders, total] = await Promise.all([
      Order.find({ status })
        .populate("customer", "name email phone")
        .populate("deliveryBoy", "name mobile")
        .populate("items")
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      Order.countDocuments({ status }),
    ]);

    return res.status(200).json({
      success: true,
      message: `Orders with status ${status} fetched successfully`,
      data: orders,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  }
);

/**
 * Get all return requests
 */
export const getReturnRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      seller,
      dateFrom,
      dateTo,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query: any = {};

    // Status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Date filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo as string);
      }
    }

    // Search filter (complex because we need to search populated fields)
    // For now, simpler implementation - search by order ID or return reason or customer
    if (search) {
      // Find orders matching search first
      const orders = await Order.find({
        orderNumber: { $regex: search as string, $options: "i" },
      }).select("_id");
      const orderIds = orders.map((o) => o._id);

      query.$or = [
        { order: { $in: orderIds } },
        { reason: { $regex: search as string, $options: "i" } },
        { description: { $regex: search as string, $options: "i" } },
      ];
    }

    // Seller filter requires looking up order items
    if (seller && seller !== "all") {
      // Find order items for this seller
      const orderItems = await OrderItem.find({ seller }).select("_id");
      const orderItemIds = orderItems.map((oi) => oi._id);
      query.orderItem = { $in: orderItemIds };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const sort: any = {};
    sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    const [requests, total] = await Promise.all([
      Return.find(query)
        .populate("order", "orderNumber")
        .populate("customer", "name email phone")
        .populate({
          path: "orderItem",
          populate: {
            path: "product",
            select: "productName mainImage",
          },
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit as string)),
      Return.countDocuments(query),
    ]);

    // Transform logic to match frontend expectations if necessary
    // AdminReturnRequest.tsx expects: _id, orderItemId, userName, productName, variant, price, quantity, total, status, requestedAt
    // It seems flattened. Let's send structured data and let frontend handle it, or flatten it here.
    // The frontend uses "request.orderItemId", "request.userName", "request.productName" etc.
    // This implies a flattened structure.

    const transformedRequests = requests.map((req: any) => ({
      _id: req._id,
      orderId: req.order?._id,
      orderNumber: req.order?.orderNumber,
      orderItemId: req.orderItem?._id, // Frontend displays this
      userId: req.customer?._id,
      userName: req.customer?.name || "Unknown",
      // product info from orderItem
      productId: req.orderItem?.product?._id,
      productName: req.orderItem?.productName || "Unknown Product",
      variant: req.orderItem?.variation,
      price: req.orderItem?.unitPrice || 0,
      quantity: req.quantity,
      total: req.quantity * (req.orderItem?.unitPrice || 0),
      reason: req.reason,
      status: req.status,
      requestedAt: req.createdAt,
      processedAt: req.processedAt,
    }));

    return res.status(200).json({
      success: true,
      message: "Return requests fetched successfully",
      data: transformedRequests,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  }
);

/**
 * Get return request by ID
 */
export const getReturnRequestById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const returnRequest = await Return.findById(id)
      .populate("order")
      .populate("customer", "name email phone")
      .populate({
        path: "orderItem",
        populate: [
          { path: "product", select: "productName mainImage" },
          { path: "seller", select: "sellerName storeName" },
        ],
      })
      .populate("processedBy", "firstName lastName");

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Return request details fetched successfully",
      data: returnRequest,
    });
  }
);

/**
 * Process return request (Update)
 */
export const processReturnRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, rejectionReason, refundAmount, adminNotes } = req.body;

    const validStatuses = ["Approved", "Rejected", "Processing", "Completed"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const returnRequest = await Return.findById(id);
    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    const updateData: any = {
      processedBy: req.user?.userId,
      processedAt: new Date(),
    };

    if (status) updateData.status = status;

    // Handle rejection reason (frontend sends 'adminNotes' for rejection reason)
    if (status === "Rejected") {
      if (rejectionReason) updateData.rejectionReason = rejectionReason;
      else if (adminNotes) updateData.rejectionReason = adminNotes;
    }

    if (status === "Approved" && refundAmount) {
      updateData.refundAmount = refundAmount;
    }

    const updatedReturn = await Return.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("order")
      .populate("orderItem")
      .populate("customer", "name email phone");

    return res.status(200).json({
      success: true,
      message: `Return request ${status ? status.toLowerCase() : "updated"
        } successfully`,
      data: updatedReturn,
    });
  }
);

/**
 * Export orders to CSV
 */
export const exportOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const { status, dateFrom, dateTo } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.orderDate = {};
      if (dateFrom) query.orderDate.$gte = new Date(dateFrom as string);
      if (dateTo) query.orderDate.$lte = new Date(dateTo as string);
    }

    const orders = await Order.find(query)
      .populate("customer", "name email phone")
      .populate("deliveryBoy", "name mobile")
      .sort({ orderDate: -1 })
      .lean();

    // Convert to CSV format
    const csvHeaders = [
      "Order Number",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Order Date",
      "Status",
      "Payment Status",
      "Total Amount",
      "Delivery Address",
      "Delivery Boy",
    ];

    const csvRows = orders.map((order) => [
      order.orderNumber,
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.orderDate.toISOString(),
      order.status,
      order.paymentStatus,
      order.total.toString(),
      `${order.deliveryAddress.address}, ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}`,
      order.deliveryBoy ? (order.deliveryBoy as any).name : "Not Assigned",
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=orders_${Date.now()}.csv`
    );
    res.send(csvContent);
  }
);
