import Order from '../models/Order';
import { Server as SocketIOServer } from 'socket.io';
import { notifySellersOfOrderUpdate } from './sellerNotificationService';
import { debugLog, notifyDeliveryBoysOfNewOrder } from './orderNotificationService';

/**
 * Order Cleanup Service
 * Automatically handles orders that are stuck in 'Received' or 'Accepted' (unassigned) states.
 */
export class OrderCleanupService {
    private static interval: NodeJS.Timeout | null = null;
    private static io: SocketIOServer | null = null;

    // Timeouts in minutes (1 minute = 60 seconds for seller acceptance)
    private static readonly SELLER_ACCEPTANCE_TIMEOUT = 1;
    private static readonly DELIVERY_ASSIGNMENT_TIMEOUT = 30;

    /**
     * Start the cleanup interval
     */
    static start(io: SocketIOServer) {
        this.io = io;
        if (this.interval) return;

        console.log('🔄 Order Cleanup Service started (Interval: 15 seconds)');
        
        // Run every 15 seconds to be highly responsive to the 60 seconds auto-accept rule
        this.interval = setInterval(() => {
            this.runCleanup();
        }, 15 * 1000);
        
        // Initial run
        this.runCleanup();
    }

    /**
     * Stop the cleanup interval
     */
    static stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    /**
     * Main cleanup logic
     */
    private static async runCleanup() {
        if (!this.io) return;

        try {
            const now = new Date();

            // 1. Handle Seller Acceptance Timeout (Status: 'Received') - Auto Accept after 60 seconds
            const sellerTimeoutDate = new Date(now.getTime() - this.SELLER_ACCEPTANCE_TIMEOUT * 60 * 1000);
            const stuckReceivedOrders = await Order.find({
                status: 'Received',
                $or: [
                    { paymentStatus: { $in: ['Paid', 'settled'] } },
                    { paymentMethod: 'COD' }
                ],
                createdAt: { $lt: sellerTimeoutDate }
            });

            for (const order of stuckReceivedOrders) {
                await this.autoAcceptOrder(order);
            }

            // 2. Handle Delivery Assignment Timeout (Status: 'Accepted' but no deliveryBoy)
            const deliveryTimeoutDate = new Date(now.getTime() - this.DELIVERY_ASSIGNMENT_TIMEOUT * 60 * 1000);
            const stuckAcceptedOrders = await Order.find({
                status: 'Accepted',
                orderType: 'quick', // Only quick commerce needs delivery assignment
                deliveryBoy: { $exists: false },
                updatedAt: { $lt: deliveryTimeoutDate }
            });

            for (const order of stuckAcceptedOrders) {
                await this.rejectOrder(order, `Auto-rejected: No delivery partner accepted within ${this.DELIVERY_ASSIGNMENT_TIMEOUT} minutes.`);
            }

            if (stuckReceivedOrders.length > 0 || stuckAcceptedOrders.length > 0) {
                const msg = `🧹 [Cleanup] Processed ${stuckReceivedOrders.length} seller auto-accepts and ${stuckAcceptedOrders.length} delivery timeouts. (Cut-off: ${sellerTimeoutDate.toISOString()})`;
                debugLog(msg);
                console.log(msg);
            }

        } catch (error) {
            console.error('❌ [OrderCleanup] Error during cleanup:', error);
        }
    }

    /**
     * Helper to automatically accept an order when seller times out
     */
    private static async autoAcceptOrder(order: any) {
        try {
            order.status = 'Accepted';
            order.adminNotes = (order.adminNotes ? order.adminNotes + '\n' : '') + `[${new Date().toISOString()}] Auto-accepted: Seller did not accept within 60 seconds.`;
            await order.save();

            const orderId = order._id.toString();
            console.log(`✅ [Cleanup] Order ${order.orderNumber} auto-accepted because seller did not accept within 60 seconds.`);

            // Notify Sellers (to stop ringing and update status on seller UI)
            if (this.io) {
                notifySellersOfOrderUpdate(this.io, order, 'STATUS_UPDATE');
            }

            // Trigger delivery notification
            if (order.orderType !== 'ecommerce' && this.io) {
                // Fetch full order with populated items and sellers for the notification service
                const fullOrder = await Order.findById(order._id)
                    .populate({
                        path: 'items',
                        populate: { path: 'seller' }
                    });
                
                if (fullOrder) {
                    await notifyDeliveryBoysOfNewOrder(this.io, fullOrder);
                    console.log(`Automatic delivery notification triggered for Auto-Accepted order ${order.orderNumber}`);
                }
            }
        } catch (err) {
            console.error(`❌ [OrderCleanup] Failed to auto-accept order ${order._id}:`, err);
        }
    }

    /**
     * Helper to reject an order and notify parties
     */
    private static async rejectOrder(order: any, reason: string) {
        try {
            // DO NOT change status as per instructions
            // order.status = 'Rejected';
            // order.adminNotes = (order.adminNotes ? order.adminNotes + '\n' : '') + `[${new Date().toISOString()}] ${reason}`;
            // await order.save();

            const orderId = order._id.toString();
            
            // Send reminder only
            console.log(`⏰ [Cleanup] REMINDER sent for Order ${order.orderNumber}: ${reason}`);

            debugLog(`⏰ [Cleanup] Order ${order.orderNumber} reminder sent: ${reason}`);
        } catch (err) {
            console.error(`❌ [OrderCleanup] Failed to process reminder for order ${order._id}:`, err);
        }
    }
}
