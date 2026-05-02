import Delivery from "../models/Delivery";
import Order from "../models/Order";
import DeliveryAssignment from "../models/DeliveryAssignment";
import { Server as SocketIOServer } from "socket.io";
import { calculateEstimatedDeliveryBoyEarning } from "./orderNotificationService";
import { notifySellersOfOrderUpdate } from "./sellerNotificationService";

export const autoAssignDeliveryBoy = async (orderId: string, io?: SocketIOServer) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return { success: false, message: "Order not found" };

    // Only auto-assign for 'quick' (instant) orders that are not yet assigned
    if (order.orderType !== 'quick' || order.deliveryBoy) {
        return { success: false, message: "Order not eligible for auto-assignment" };
    }

    const { latitude, longitude } = order.deliveryAddress;
    if (!latitude || !longitude) {
        return { success: false, message: "Order delivery location coordinates missing" };
    }

    // Find nearest online and approved delivery boy within 10km
    const maxDistanceInMeters = 10000; 
    
    const nearbyDeliveryBoys = await Delivery.find({
      status: "Approved",
      isOnline: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude], // [long, lat]
          },
          $maxDistance: maxDistanceInMeters,
        },
      },
    }).limit(5);

    if (nearbyDeliveryBoys.length === 0) {
      console.log(`[AutoAssign] No nearby delivery boys found for Order ${order.orderNumber}`);
      return { success: false, message: "No nearby delivery boys available" };
    }

    // Assign the first one (nearest)
    const deliveryBoy = nearbyDeliveryBoys[0];
    const deliveryBoyId = deliveryBoy._id;

    order.deliveryBoy = deliveryBoyId as any;
    order.deliveryBoyStatus = "Assigned";
    order.assignedAt = new Date();
    await order.save();

    // Create assignment record
    await DeliveryAssignment.findOneAndUpdate(
      { order: orderId },
      {
        order: orderId,
        deliveryBoy: deliveryBoyId,
        assignedAt: new Date(),
        status: "Assigned",
      },
      { upsert: true, new: true }
    );

    console.log(`[AutoAssign] Assigned Order ${order.orderNumber} to ${deliveryBoy.name} (ID: ${deliveryBoyId})`);

    // Notify via Socket
    if (io) {
      const updatedOrder = await Order.findById(orderId)
        .populate("customer", "name email phone")
        .populate("deliveryBoy", "name mobile email")
        .populate("items");

      if (updatedOrder) {
        const earning = await calculateEstimatedDeliveryBoyEarning(updatedOrder);
        const orderWithEarning = {
          ...updatedOrder.toObject(),
          deliveryBoyEarning: earning
        };

        // Notify Delivery Boy
        io.to(`delivery-${deliveryBoyId}`).emit("new-order", orderWithEarning);
        
        // Backward compatibility
        io.to(`delivery-${deliveryBoyId}`).emit("order-assigned", {
          orderId: orderId,
          orderNumber: updatedOrder.orderNumber,
          message: "A new order has been auto-assigned to you",
          order: orderWithEarning
        });

        // Notify Sellers
        notifySellersOfOrderUpdate(io, updatedOrder, "STATUS_UPDATE");
        
        // Notify specific order room
        io.to(`order-${orderId}`).emit("delivery-assigned", {
          orderId: orderId,
          deliveryBoy: updatedOrder.deliveryBoy,
          message: "Delivery partner assigned automatically"
        });
      }
    }

    return { success: true, deliveryBoyId };
  } catch (error: any) {
    console.error("[AutoAssign] Error:", error.message);
    return { success: false, message: error.message };
  }
};
