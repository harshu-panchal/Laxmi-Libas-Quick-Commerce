import Order from '../models/Order';
import { Server as SocketIOServer } from 'socket.io';
import { notifySellersOfOrderUpdate } from './sellerNotificationService';
import { debugLog } from './orderNotificationService';

/**
 * Order Cleanup Service
 * Automatically handles orders that are stuck in 'Received' or 'Accepted' (unassigned) states.
 */
export class OrderCleanupService {
    private static interval: NodeJS.Timeout | null = null;
    private static io: SocketIOServer | null = null;

    // Timeouts in minutes (increased to 30m to be less aggressive)
    private static readonly SELLER_ACCEPTANCE_TIMEOUT = 30;
    private static readonly DELIVERY_ASSIGNMENT_TIMEOUT = 30;

    /**
     * Start the cleanup interval
     */
    static start(io: SocketIOServer) {
        this.io = io;
        if (this.interval) return;

        console.log('🔄 Order Cleanup Service started (Interval: 2 minutes)');
        
        // Run every 2 minutes
        this.interval = setInterval(() => {
            this.runCleanup();
        }, 2 * 60 * 1000);
        
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

            // 1. Handle Seller Acceptance Timeout (Status: 'Received')
            const sellerTimeoutDate = new Date(now.getTime() - this.SELLER_ACCEPTANCE_TIMEOUT * 60 * 1000);
            const stuckReceivedOrders = await Order.find({
                status: 'Received',
                paymentStatus: { $in: ['Paid', 'settled'] }, // Only paid orders
                createdAt: { $lt: sellerTimeoutDate }
            });

            for (const order of stuckReceivedOrders) {
                await this.rejectOrder(order, `Auto-rejected: Seller did not accept within ${this.SELLER_ACCEPTANCE_TIMEOUT} minutes.`);
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
                const msg = `🧹 [Cleanup] Processed ${stuckReceivedOrders.length} seller timeouts and ${stuckAcceptedOrders.length} delivery timeouts. (Cut-off: ${sellerTimeoutDate.toISOString()})`;
                debugLog(msg);
                console.log(msg);
            }

        } catch (error) {
            console.error('❌ [OrderCleanup] Error during cleanup:', error);
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

            /*
            // Notify Customer via Socket
            this.io?.to(`order-${orderId}`).emit('order-rejected', {
                orderId,
                message: 'We apologize, but your order could not be fulfilled at this time. A refund (if applicable) will be processed.',
                reason
            });

            // Notify Sellers (to stop ringing)
            if (this.io) {
                notifySellersOfOrderUpdate(this.io, order, 'STATUS_UPDATE');
            }

            // Emit to general delivery room to stop any pending acceptance UI
            this.io?.to('delivery-notifications').emit('order-accepted', {
                orderId,
                acceptedBy: 'SYSTEM_REJECTED'
            });
            */

            debugLog(`⏰ [Cleanup] Order ${order.orderNumber} reminder sent: ${reason}`);
        } catch (err) {
            console.error(`❌ [OrderCleanup] Failed to process reminder for order ${order._id}:`, err);
        }
    }
}
