import { 
  Order, 
  HotelBooking, 
  BusBooking, 
  Seller, 
  Hotel, 
  Bus, 
  BusSchedule 
} from "../models";
import mongoose from "mongoose";

export interface AnalyticsPeriod {
  startDate: Date;
  endDate: Date;
}

export const getPeriodDates = (period: string): AnalyticsPeriod => {
  const endDate = new Date();
  let startDate = new Date();

  switch (period) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "7days":
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "30days":
      startDate.setDate(endDate.getDate() - 30);
      break;
    case "custom":
      // Handle custom elsewhere or default to 30
      startDate.setDate(endDate.getDate() - 30);
      break;
    default:
      startDate.setDate(endDate.getDate() - 7);
  }

  return { startDate, endDate };
};

/**
 * Admin Analytics Service
 */
export const getAdminAnalytics = async (periodStr: string) => {
  const { startDate, endDate } = getPeriodDates(periodStr);

  const [
    globalStats,
    dailyStats,
    typeSplit,
    moduleDistribution,
    locationAnalytics,
    recentActivity
  ] = await Promise.all([
    // 1. Global System View (All time)
    Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: { $in: ["Paid", "settled"] } } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]),
      HotelBooking.countDocuments({ bookingStatus: { $ne: "Cancelled" } }),
      BusBooking.countDocuments({ status: { $ne: "cancelled" } }),
      Seller.countDocuments({ status: "Approved" })
    ]),

    // 2. Daily Stats (Requested period)
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orderCount: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $in: ["$paymentStatus", ["Paid", "settled"]] }, "$total", 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // 3. Order Type Split (Quick vs Standard)
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$orderType", count: { $sum: 1 } } }
    ]),

    // 4. Module Distribution (Products vs Hotels vs Buses)
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]),

    // 5. Location Analytics
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$deliveryAddress.city", count: { $sum: 1 }, revenue: { $sum: "$total" } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),

    // 6. Recent Activity
    Promise.all([
      Order.find().sort({ createdAt: -1 }).limit(5).populate("customer", "name"),
      HotelBooking.find().sort({ createdAt: -1 }).limit(5).populate("hotelId", "name"),
      Seller.find({ status: "Approved" }).sort({ createdAt: -1 }).limit(5)
    ])
  ]);

  return {
    global: {
      totalOrders: globalStats[0],
      totalRevenue: globalStats[1][0]?.total || 0,
      totalBookings: globalStats[2] + globalStats[3],
      totalSellers: globalStats[4]
    },
    dailyStats,
    typeSplit,
    moduleDistribution,
    locationAnalytics,
    recentActivity: {
      latestOrders: recentActivity[0],
      latestBookings: recentActivity[1],
      latestSellers: recentActivity[2]
    }
  };
};

/**
 * Seller Analytics Service
 */
export const getSellerAnalytics = async (sellerId: string, periodStr: string) => {
  const { startDate, endDate } = getPeriodDates(periodStr);
  const sId = new mongoose.Types.ObjectId(sellerId);

  // For seller, we need to find orders where their items are present
  // This is tricky if Order doesn't have sellerId at root.
  // We'll use the existing logic from dashboardController: find orders via OrderItem
  
  // First, get basic seller info to know if they are hotel/bus
  const seller = await Seller.findById(sellerId);
  if (!seller) throw new Error("Seller not found");

  const [
    orderStats,
    dailyChartData,
    hotelStats,
    busStats
  ] = await Promise.all([
    // 1. Seller Metrics
    Order.aggregate([
      { $match: { "sellerPickups.seller": sId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $cond: [{ $in: ["$paymentStatus", ["Paid", "settled"]] }, "$total", 0] } },
          pendingOrders: { $sum: { $cond: [{ $in: ["$status", ["Received", "Accepted", "Pending"]] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } }
        }
      }
    ]),

    // 2. Charts (Daily)
    Order.aggregate([
      { $match: { "sellerPickups.seller": sId, createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orders: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $in: ["$paymentStatus", ["Paid", "settled"]] }, "$total", 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // 3. Hotel Partner Specifics (if applicable)
    seller.businessTypes.includes('hotel') ? HotelBooking.aggregate([
      { $match: { hotelId: { $in: await getSellerHotelIds(sellerId) } } },
      {
        $group: {
          _id: null,
          roomsBooked: { $sum: 1 },
          totalEarnings: { $sum: "$totalAmount" }
        }
      }
    ]) : Promise.resolve([]),

    // 4. Bus Operator Specifics (if applicable)
    seller.businessTypes.includes('bus') ? BusBooking.aggregate([
      { $match: { scheduleId: { $in: await getSellerBusScheduleIds(sellerId) } } },
      {
        $group: {
          _id: null,
          ticketsSold: { $sum: { $size: "$seats" } },
          revenue: { $sum: "$totalAmount" }
        }
      }
    ]) : Promise.resolve([])
  ]);

  return {
    metrics: orderStats[0] || { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, completedOrders: 0 },
    charts: dailyChartData,
    hotel: hotelStats[0] || { roomsBooked: 0, totalEarnings: 0 },
    bus: busStats[0] || { ticketsSold: 0, revenue: 0 }
  };
};

// Helper to get all hotel IDs for a seller
async function getSellerHotelIds(sellerId: string) {
  const hotels = await Hotel.find({ sellerId }).select("_id");
  return hotels.map(h => h._id);
}

// Helper to get all bus schedule IDs for a seller
async function getSellerBusScheduleIds(sellerId: string) {
  const buses = await Bus.find({ sellerId }).select("_id");
  const schedules = await BusSchedule.find({ busId: { $in: buses.map(b => b._id) } }).select("_id");
  return schedules.map(s => s._id);
}
