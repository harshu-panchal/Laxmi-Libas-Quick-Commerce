import mongoose from 'mongoose';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import Seller from '../models/Seller';
import Commission from '../models/Commission';
import WalletTransaction from '../models/WalletTransaction';
import AppSettings from '../models/AppSettings';

/**
 * Service to handle financial settlement for orders
 */
export class OrderSettlementService {
    /**
     * Settles the payment for a specific order by crediting the seller's wallet
     * and recording the platform commission.
     */
    static async settleOrder(orderId: string) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Fetch the order with items
            const order = await Order.findById(orderId).session(session);
            if (!order) throw new Error(`Order ${orderId} not found`);

            // If already paid, skip to avoid double settlement
            if (order.paymentStatus === 'Paid' && order.status === 'Delivered') {
                 // Check if settlement already exists to be extra safe
                 const existingTx = await WalletTransaction.findOne({ 
                     relatedOrder: order._id, 
                     type: 'Credit' 
                 }).session(session);
                 
                 if (existingTx) {
                     console.log(`[Settlement] Order ${order.orderNumber} already settled. Skipping.`);
                     await session.abortTransaction();
                     return { success: true, alreadySettled: true };
                 }
            }

            // 2. Identify sellers in this order (handling multi-seller orders if applicable)
            // Currently, the system seems to have one seller per order item or one seller per order.
            // Based on orderController.ts, it credits the seller associated with the items.
            
            const orderItems = await OrderItem.find({ order: order._id }).session(session);
            const sellerIds = [...new Set(orderItems.map(item => item.seller.toString()))];

            const settings = await AppSettings.getSettings();
            const results = [];

            for (const sellerId of sellerIds) {
                const seller = await Seller.findById(sellerId).session(session);
                if (!seller) {
                    console.warn(`[Settlement] Seller ${sellerId} not found for order ${orderId}`);
                    continue;
                }

                // Calculate total for this seller's items in this order
                const sellerItems = orderItems.filter(item => item.seller.toString() === sellerId);
                const sellerSubtotal = sellerItems.reduce((sum, item) => sum + (item.total || 0), 0);

                // Get commission rate: Seller specific OR Global default
                const commissionRate = seller.commissionRate !== undefined 
                    ? seller.commissionRate 
                    : (settings.globalCommissionRate || 10);

                const commissionAmount = (sellerSubtotal * commissionRate) / 100;
                const netEarning = sellerSubtotal - commissionAmount;

                // 3. Create Commission Record
                const commission = new Commission({
                    order: order._id,
                    seller: seller._id,
                    type: "SELLER",
                    orderAmount: sellerSubtotal,
                    commissionRate: commissionRate,
                    commissionAmount: commissionAmount,
                    status: "Paid",
                    paidAt: new Date()
                });
                await commission.save({ session });

                // 4. Update Seller Balance
                seller.balance = (seller.balance || 0) + netEarning;
                await seller.save({ session });

                // 5. Create Wallet Transaction for Seller
                const transaction = new WalletTransaction({
                    userId: seller._id,
                    userType: "SELLER",
                    amount: netEarning,
                    type: "Credit",
                    status: "Completed",
                    description: `Earnings from Order #${order.orderNumber}`,
                    reference: `SETTLE-${order.orderNumber}-${seller._id.toString().slice(-4)}-${Date.now()}`,
                    relatedOrder: order._id,
                    relatedCommission: commission._id
                });
                await transaction.save({ session });

                results.push({
                    sellerId,
                    netEarning,
                    commissionAmount
                });
            }

            // 6. Finalize order status if needed (though webhook usually does this)
            if (order.status !== 'Delivered') {
                order.status = 'Delivered';
                order.paymentStatus = 'settled';
                await order.save({ session });
            } else {
                order.paymentStatus = 'settled';
                await order.save({ session });
            }

            await session.commitTransaction();
            console.log(`[Settlement] Successfully settled Order ${order.orderNumber} for ${results.length} seller(s)`);
            return { success: true, results };

        } catch (error: any) {
            await session.abortTransaction();
            console.error(`[Settlement] Failed to settle Order ${orderId}:`, error.message);
            throw error;
        } finally {
            session.endSession();
        }
    }
}
