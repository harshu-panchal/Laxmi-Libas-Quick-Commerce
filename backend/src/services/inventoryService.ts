import mongoose from 'mongoose';
import Product from '../models/Product';
import HotelBooking from '../models/HotelBooking';
import BusBooking from '../models/BusBooking';
import SeatLock from '../models/SeatLock';
import RoomAvailability from '../models/RoomAvailability';
import HotelRoom from '../models/HotelRoom';
import BusSchedule from '../models/BusSchedule';

export class InventoryService {
  /**
   * Locks stock for products
   */
  static async lockProductStock(userId: string, items: any[], durationMinutes: number = 10) {
    const expiresAt = new Date(Date.now() + durationMinutes * 60000);
    const lockResults = [];

    for (const item of items) {
      const productId = item.product.id || item.product._id;
      const quantity = Number(item.quantity);
      const variationId = item.variant?._id || item.variation?._id || null;

      // Find product and check if enough "true" available stock exists
      // Available = actual stock - active locks
      const product = await Product.findById(productId);
      if (!product) throw new Error(`Product ${productId} not found`);

      // Calculate active locks quantity
      const activeLocksQty = product.stockLocks
        .filter(lock => lock.expiresAt > new Date())
        .reduce((sum, lock) => sum + lock.quantity, 0);

      const availableStock = product.stock - activeLocksQty;

      if (availableStock < quantity) {
        throw new Error(`Insufficient available stock for ${product.productName}. Available: ${availableStock}, Requested: ${quantity}`);
      }

      // Add lock
      product.stockLocks.push({
        userId: new mongoose.Types.ObjectId(userId),
        quantity,
        expiresAt,
        variationId: variationId ? variationId.toString() : undefined
      });

      await product.save();
      lockResults.push({ productId, quantity, expiresAt });
    }

    return lockResults;
  }

  /**
   * Confirms a lock (reduces actual stock and removes lock)
   */
  static async confirmProductLocks(userId: string) {
    const products = await Product.find({ "stockLocks.userId": new mongoose.Types.ObjectId(userId) });

    for (const product of products) {
      const userLocks = product.stockLocks.filter(lock => lock.userId.toString() === userId.toString() && lock.expiresAt > new Date());
      
      let totalToReduce = 0;
      for (const lock of userLocks) {
        totalToReduce += lock.quantity;
      }

      if (totalToReduce > 0) {
        // Reduce stock permanently and remove user's active locks
        await Product.findByIdAndUpdate(product._id, {
          $inc: { stock: -totalToReduce },
          $pull: { stockLocks: { userId: new mongoose.Types.ObjectId(userId) } }
        });
      }
    }
  }

  /**
   * Releases locks for a user (e.g. on payment failure)
   */
  static async releaseProductLocks(userId: string) {
    await Product.updateMany(
      { "stockLocks.userId": new mongoose.Types.ObjectId(userId) },
      { $pull: { stockLocks: { userId: new mongoose.Types.ObjectId(userId) } } }
    );
  }

  /**
   * Cleans up expired locks (can be called via Cron)
   */
  static async cleanupExpiredLocks() {
    const now = new Date();
    await Product.updateMany(
      {},
      { $pull: { stockLocks: { expiresAt: { $lt: now } } } }
    );
  }

  /**
   * Hotel Room Locking
   */
  static async lockHotelRoom(bookingId: string, durationMinutes: number = 10) {
    const expiresAt = new Date(Date.now() + durationMinutes * 60000);
    return await HotelBooking.findByIdAndUpdate(bookingId, {
      bookingStatus: 'LOCKED',
      expiresAt: expiresAt
    }, { new: true });
  }

  /**
   * Bus Seat Locking Layer (Non-breaking)
   */
  static async createSeatLocks(scheduleId: string, seatNumbers: string[], userId: string, durationMinutes: number = 15) {
    const expiresAt = new Date(Date.now() + durationMinutes * 60000);
    
    // Check if any seat is already locked
    const existingLocks = await SeatLock.find({
      scheduleId: new mongoose.Types.ObjectId(scheduleId),
      seatNumber: { $in: seatNumbers },
      expiresAt: { $gt: new Date() }
    });

    if (existingLocks.length > 0) {
      const lockedSeats = existingLocks.map(l => l.seatNumber).join(', ');
      throw new Error(`Seats ${lockedSeats} are already temporarily locked by another user.`);
    }

    // Check if any seat is already booked in the schedule
    const schedule = await BusSchedule.findById(scheduleId);
    if (!schedule) throw new Error('Bus schedule not found');

    const bookedSeats = schedule.seats
      .filter(s => seatNumbers.includes(s.seatNumber) && s.isBooked)
      .map(s => s.seatNumber);

    if (bookedSeats.length > 0) {
      throw new Error(`Seats ${bookedSeats.join(', ')} are already booked.`);
    }

    // Create locks
    const locks = seatNumbers.map(seatNumber => ({
      scheduleId: new mongoose.Types.ObjectId(scheduleId),
      seatNumber,
      userId: new mongoose.Types.ObjectId(userId),
      expiresAt
    }));

    await SeatLock.insertMany(locks);
    return locks;
  }

  static async releaseSeatLocks(userId: string) {
    await SeatLock.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
  }

  /**
   * Hotel Room Availability Layer (Non-breaking)
   */
  static async checkAndLockRoomAvailability(hotelId: string, roomId: string, checkIn: Date, checkOut: Date, count: number) {
    const dates = [];
    let curr = new Date(checkIn);
    while (curr < checkOut) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }

    for (const date of dates) {
      let availability = await RoomAvailability.findOne({ roomId: new mongoose.Types.ObjectId(roomId), date });
      
      if (!availability) {
        const room = await HotelRoom.findById(roomId);
        if (!room) throw new Error('Room type not found');
        
        availability = new RoomAvailability({
          hotelId: new mongoose.Types.ObjectId(hotelId),
          roomId: new mongoose.Types.ObjectId(roomId),
          date,
          totalRooms: room.totalRooms || room.availableRooms || 10, // Fallback if schema differs
          bookedRooms: 0
        });
        await availability.save();
      }

      if (availability.bookedRooms + count > availability.totalRooms) {
        throw new Error(`Room not available for date ${date.toLocaleDateString()}`);
      }
    }

    // We don't increment bookedRooms yet, that happens on payment success
    return true;
  }

  static async confirmRoomBooking(hotelId: string, roomId: string, checkIn: Date, checkOut: Date, count: number) {
    const dates = [];
    let curr = new Date(checkIn);
    while (curr < checkOut) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }

    for (const date of dates) {
      await RoomAvailability.findOneAndUpdate(
        { roomId: new mongoose.Types.ObjectId(roomId), date },
        { $inc: { bookedRooms: count } },
        { upsert: true, new: true }
      );
    }
  }
}
