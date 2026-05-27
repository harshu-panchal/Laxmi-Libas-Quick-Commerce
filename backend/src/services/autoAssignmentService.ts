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
    
    let nearbyDeliveryBoys: any[] = [];
    try {
      nearbyDeliveryBoys = await Delivery.find({
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
    } catch (geoErr: any) {
      if (geoErr?.code === 291 || geoErr?.codeName === 'NoQueryExecutionPlans') {
        const all = await Delivery.find({
          status: 'Approved',
          isOnline: true,
          'location.coordinates.0': { $exists: true },
        }).limit(20);
        const R = 6371;
        nearbyDeliveryBoys = all
          .map((db) => {
            const [lng, lat] = db.location?.coordinates || [0, 0];
            const dLat = ((lat - latitude) * Math.PI) / 180;
            const dLng = ((lng - longitude) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) ** 2 +
              Math.cos((latitude * Math.PI) / 180) *
                Math.cos((lat * Math.PI) / 180) *
                Math.sin(dLng / 2) ** 2;
            const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return { doc: db, distKm };
          })
          .filter((x) => x.distKm <= maxDistanceInMeters / 1000)
          .sort((a, b) => a.distKm - b.distKm)
          .slice(0, 5)
          .map((x) => x.doc);
      } else {
        throw geoErr;
      }
    }

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
