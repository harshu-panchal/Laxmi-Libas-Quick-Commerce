import mongoose from 'mongoose';
import Product from '../models/Product';
import HotelBooking from '../models/HotelBooking';
import BusBooking from '../models/BusBooking';

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
   * Bus Seat Locking
   */
  static async lockBusSeats(bookingId: string, durationMinutes: number = 10) {
    const expiresAt = new Date(Date.now() + durationMinutes * 60000);
    return await BusBooking.findByIdAndUpdate(bookingId, {
      status: 'LOCKED',
      expiresAt: expiresAt
    }, { new: true });
  }
}
