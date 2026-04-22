import mongoose from "mongoose";
import Seller from "../models/Seller";
import Commission from "../models/Commission";
import AppSettings from "../models/AppSettings";
import WalletTransaction from "../models/WalletTransaction";

/**
 * Handles the financial settlement for a successful booking (Hotel/Bus)
 */
export const processBookingSettlement = async (
  bookingId: string,
  type: 'hotel' | 'bus',
  totalAmount: number,
  sellerId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const seller = await Seller.findById(sellerId).session(session);
    if (!seller) throw new Error("Seller not found for settlement");

    const settings = await AppSettings.getSettings();
    
    // Get commission rate: Seller specific OR Global default
    const commissionRate = seller.commissionRate !== undefined 
      ? seller.commissionRate 
      : (settings.globalCommissionRate || 10);

    const commissionAmount = (totalAmount * commissionRate) / 100;
    const sellerShare = totalAmount - commissionAmount;

    // 1. Create Commission Record
    // Note: We're reusing the Commission model. Since 'order' field is required 
    // and refs 'Order', we might need to be careful. 
    // For now, we'll store the bookingId but since MongoDB doesn't enforce 
    // ref integrity unless we use $lookup, it should work for tracking.
    const commission = new Commission({
      order: new mongoose.Types.ObjectId(bookingId), // Using bookingId as orderId
      seller: seller._id,
      type: "SELLER",
      orderAmount: totalAmount,
      commissionRate: commissionRate,
      commissionAmount: commissionAmount,
      status: "Paid", // For hotels, we mark it as paid to the wallet instantly
      paidAt: new Date()
    });
    await commission.save({ session });

    // 2. Update Seller Balance
    seller.balance = (seller.balance || 0) + sellerShare;
    await seller.save({ session });

    // 3. Create Wallet Transaction for Seller
    const transaction = new WalletTransaction({
      seller: seller._id,
      amount: sellerShare,
      type: "credit",
      status: "completed",
      description: `Earning from ${type === 'hotel' ? 'Hotel' : 'Bus'} Booking: ${bookingId}`,
      relatedCommission: commission._id,
      balanceAfter: seller.balance
    });
    await transaction.save({ session });

    await session.commitTransaction();
    console.log(`💰 [Settlement] Processed for ${type} booking ${bookingId}. Seller Share: ₹${sellerShare}, Admin Comm: ₹${commissionAmount}`);
    
    return { success: true, sellerShare, commissionAmount };
  } catch (error: any) {
    await session.abortTransaction();
    console.error(`❌ [Settlement] Error processing ${type} booking ${bookingId}:`, error.message);
    throw error;
  } finally {
    session.endSession();
  }
};
