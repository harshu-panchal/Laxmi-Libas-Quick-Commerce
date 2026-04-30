import mongoose from "mongoose";
import Seller from "../models/Seller";
import Customer from "../models/Customer";
import Commission from "../models/Commission";


/**
 * Process seller commission payment
 */
export const processSellerCommission = async (
  sellerId: string,
  commissionId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const commission = await Commission.findById(commissionId).session(session);
    if (!commission || !commission.seller || commission.seller.toString() !== sellerId) {
      throw new Error("Commission not found or does not belong to seller");
    }

    if (commission.status !== "Pending") {
      throw new Error("Commission already processed");
    }

    const seller = await Seller.findById(sellerId).session(session);
    if (!seller) {
      throw new Error("Seller not found");
    }

    // Add commission to seller balance
    seller.balance += commission.commissionAmount;
    await seller.save({ session });

    // Update commission status
    commission.status = "Paid";
    commission.paidAt = new Date();
    await commission.save({ session });

    await session.commitTransaction();
    return {
      seller,
      commission,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Process withdrawal request
 */
export const processWithdrawal = async (
  sellerId: string,
  amount: number,
  paymentReference?: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const seller = await Seller.findById(sellerId).session(session);
    if (!seller) {
      throw new Error("Seller not found");
    }

    if (seller.balance < amount) {
      throw new Error("Insufficient balance");
    }

    // Deduct from seller balance
    seller.balance -= amount;
    await seller.save({ session });

    // Mark pending commissions as paid (if withdrawal covers them)
    const pendingCommissions = await Commission.find({
      seller: sellerId,
      status: "Pending",
    }).sort({ createdAt: 1 }).session(session);

    let remainingAmount = amount;
    for (const commission of pendingCommissions) {
      if (remainingAmount >= commission.commissionAmount) {
        commission.status = "Paid";
        commission.paidAt = new Date();
        commission.paymentReference = paymentReference;
        await commission.save({ session });
        remainingAmount -= commission.commissionAmount;
      } else {
        break;
      }
    }

    await session.commitTransaction();
    return {
      seller,
      withdrawalAmount: amount,
      paymentReference,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Calculate seller earnings
 */
export const calculateSellerEarnings = async (
  sellerId: string,
  period?: { start: Date; end: Date }
) => {
  const query: any = { seller: sellerId, status: "Paid" };

  if (period) {
    query.paidAt = {
      $gte: period.start,
      $lte: period.end,
    };
  }

  const commissions = await Commission.find(query);

  const totalEarnings = commissions.reduce(
    (sum, c) => sum + c.commissionAmount,
    0
  );
  const totalOrders = commissions.length;

  return {
    totalEarnings,
    totalOrders,
    commissions,
  };
};

/**
 * Process customer wallet transaction
 */
export const processCustomerWalletTransaction = async (
  customerId: string,
  amount: number,
  type: "credit" | "debit",
  reason: string
) => {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new Error("Customer not found");
  }

  if (type === "debit" && customer.walletAmount < amount) {
    throw new Error("Insufficient wallet balance");
  }

  const previousBalance = customer.walletAmount;
  customer.walletAmount =
    type === "credit"
      ? customer.walletAmount + amount
      : customer.walletAmount - amount;

  await customer.save();

  return {
    customer,
    transaction: {
      type,
      amount,
      reason,
      previousBalance,
      newBalance: customer.walletAmount,
    },
  };
};

/**
 * Process fund transfer between accounts
 */
export const processFundTransfer = async (
  fromType: "seller" | "customer",
  fromId: string,
  toType: "seller" | "customer",
  toId: string,
  amount: number
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get from account
    let fromAccount: any;
    if (fromType === "seller") {
      fromAccount = await Seller.findById(fromId).session(session);
    } else {
      fromAccount = await Customer.findById(fromId).session(session);
    }

    if (!fromAccount) {
      throw new Error("From account not found");
    }

    const fromBalanceField = fromType === "seller" ? "balance" : "walletAmount";
    if (fromAccount[fromBalanceField] < amount) {
      throw new Error("Insufficient balance");
    }

    // Get to account
    let toAccount: any;
    if (toType === "seller") {
      toAccount = await Seller.findById(toId).session(session);
    } else {
      toAccount = await Customer.findById(toId).session(session);
    }

    if (!toAccount) {
      throw new Error("To account not found");
    }

    // Process transfer
    fromAccount[fromBalanceField] -= amount;
    const toBalanceField = toType === "seller" ? "balance" : "walletAmount";
    toAccount[toBalanceField] += amount;

    // Use session for both saves to ensure atomicity
    await fromAccount.save({ session });
    await toAccount.save({ session });

    await session.commitTransaction();

    return {
      from: {
        type: fromType,
        id: fromId,
        previousBalance: fromAccount[fromBalanceField] + amount,
        newBalance: fromAccount[fromBalanceField],
      },
      to: {
        type: toType,
        id: toId,
        previousBalance: toAccount[toBalanceField] - amount,
        newBalance: toAccount[toBalanceField],
      },
      amount,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

