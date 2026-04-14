import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  getWalletTransactions,
  createWithdrawalRequest,
  getWithdrawalRequests,
} from "../../../services/walletManagementService";
import {
  getCommissionSummary,
  processPendingCODPayouts,
} from "../../../services/commissionService";
import Delivery from "../../../models/Delivery";
import WalletTransaction from "../../../models/WalletTransaction";
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from '@phonepe-pg/pg-sdk-node';

/**
 * Get delivery boy wallet balance and pending admin payout
 */
export const getBalance = async (req: Request, res: Response) => {
  try {
    const deliveryBoyId = req.user!.userId;
    const deliveryBoy = await Delivery.findById(deliveryBoyId).select(
      "balance pendingAdminPayout",
    );

    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,
        message: "Delivery boy not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        balance: deliveryBoy.balance,
        pendingAdminPayout: deliveryBoy.pendingAdminPayout || 0,
      },
    });
  } catch (error: any) {
    console.error("Error getting wallet balance:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get wallet balance",
    });
  }
};

/**
 * Create PhonePe order for paying admin
 */
export const createAdminPayoutOrder = async (req: Request, res: Response) => {
  try {
    const deliveryBoyId = req.user!.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payout amount",
      });
    }

    const deliveryBoy = await Delivery.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,
        message: "Delivery boy not found",
      });
    }

    if ((deliveryBoy.pendingAdminPayout || 0) < amount) {
      return res.status(400).json({
        success: false,
        message: "Payout amount exceeds pending amount",
      });
    }

    const isMock = process.env.USE_MOCK_PAYMENT === 'true';

    // PhonePe has a 38 character limit for merchantOrderId. 
    // OLD ID was ~51 chars: PAYOUT-ADMIN-69d934f937cf31b5561079fb-1775887213644
    // NEW ID is ~20 chars: PA-1775887213644-ABCD
    const shortRandom = Math.random().toString(36).substring(2, 6).toUpperCase();
    const merchantTransactionId = isMock 
        ? `MOCK-${amount}-${Date.now()}` 
        : `PA${Date.now()}${shortRandom}`;

    const amountInPaise = Math.round(amount * 100);

    // Dynamic Origin Detection: Use origin/referer from request if it matches valid origins
    // Default to .env value
    let frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    
    try {
        const requestOrigin = req.headers.origin || req.headers.referer;
        if (requestOrigin) {
            const url = new URL(requestOrigin);
            const originBase = `${url.protocol}//${url.host}`;
            
            // Whitelist for safety: Allow localhost and the configured frontend URL
            const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', frontendUrl];
            if (allowedOrigins.some(o => originBase.toLowerCase().startsWith(o.toLowerCase()))) {
                frontendUrl = originBase;
                console.log(`[PayToAdmin] Detected allowed origin: ${frontendUrl}`);
            }
        }
    } catch (err) {
        console.warn('[PayToAdmin] Failed to parse origin header, falling back to ENV');
    }

    if (isMock) {
        console.log(`[PayToAdmin] MOCK MODE enabled. Redirecting back with success correlation to ${frontendUrl}`);
        return res.status(200).json({
            success: true,
            data: {
                redirectUrl: `${frontendUrl}/delivery/wallet?merchantTransactionId=${merchantTransactionId}`,
                merchantTransactionId,
                amount
            }
        });
    }

    const clientId = process.env.PHONEPE_CLIENT_ID?.trim() || '';
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET?.trim() || '';
    const clientVersion = Number(process.env.PHONEPE_CLIENT_VERSION?.trim()) || 1;
    const phonepeEnv = process.env.PHONEPE_ENV?.trim().toUpperCase();

    // Use SANDBOX as default for safety, or PRODUCTION if explicitly set
    const env = (phonepeEnv === 'PRODUCTION')
      ? Env.PRODUCTION
      : Env.SANDBOX;

    const phonePeClient = StandardCheckoutClient.getInstance(
      clientId,
      clientSecret,
      clientVersion,
      env
    );

    // NOTE: Callback must match the route mounted in index.ts (/api/v1/payments/phonepe/callback)

    console.log(`[PayToAdmin] Creating PhonePe session: ${merchantTransactionId} | Amount: ${amount} | Env: ${phonepeEnv}`);

    // NOTE: In PhonePe SDK v2.0.5, callbackUrl is NOT supported on the builder.
    // It must be configured in your PhonePe Merchant Dashboard.
    const payRequest = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantTransactionId)
      .amount(amountInPaise)
      .redirectUrl(`${frontendUrl}/delivery/wallet?merchantTransactionId=${merchantTransactionId}`)
      .build();

    const phonePeResponse = await phonePeClient.pay(payRequest);

    return res.status(200).json({
      success: true,
      data: {
        redirectUrl: phonePeResponse.redirectUrl,
        merchantTransactionId,
        amount
      }
    });
  } catch (error: any) {
    console.error("❌ [PayToAdmin] Error creating payout order:", error);
    if (error.response) {
      console.error("❌ [PayToAdmin] PhonePe Response Error:", error.response.data);
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create payout order",
      error: error.response?.data || error.stack
    });
  }
};

/**
 * Verify admin payout payment
 */
export const verifyAdminPayout = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deliveryBoyId = req.user!.userId;
    const { merchantTransactionId } = req.body;

    const isMock = process.env.USE_MOCK_PAYMENT === 'true' || merchantTransactionId?.startsWith('MOCK-');
    let amount = 0;

    if (isMock) {
        console.log(`[PayToAdmin] Verifying MOCK payment: ${merchantTransactionId}`);
        // Extract amount from MOCK-AMOUNT-TIMESTAMP
        const parts = merchantTransactionId.split('-');
        amount = parseFloat(parts[1]) || 0;
        
        if (amount <= 0) {
            throw new Error("Invalid amount in mock payout ID");
        }
    } else {
        const clientId = process.env.PHONEPE_CLIENT_ID?.trim() || '';
        const clientSecret = process.env.PHONEPE_CLIENT_SECRET?.trim() || '';
        const clientVersion = Number(process.env.PHONEPE_CLIENT_VERSION?.trim()) || 1;
        const phonepeEnv = process.env.PHONEPE_ENV?.trim().toUpperCase();
        const env = (phonepeEnv === 'PRODUCTION')
          ? Env.PRODUCTION
          : Env.SANDBOX;

        const phonePeClient = StandardCheckoutClient.getInstance(
          clientId,
          clientSecret,
          clientVersion,
          env
        );

        const statusResponse = await phonePeClient.getOrderStatus(merchantTransactionId);
        const state = (statusResponse as any).state || (statusResponse as any).data?.state;

        if (state !== 'COMPLETED') {
          console.error(`[PayToAdmin] PhonePe state for ${merchantTransactionId} is ${state}`);
          return res.status(400).json({
            success: false,
            message: `Payment status is ${state}`,
          });
        }

        amount = ((statusResponse as any).amount || (statusResponse as any).data?.amount) / 100;
    }

    console.log(`[PayToAdmin] Amount to verify: ₹${amount}`);

    // Update delivery boy pendingAdminPayout
    const deliveryBoy = await Delivery.findById(deliveryBoyId).session(session);
    if (!deliveryBoy) {
      console.error(`[PayToAdmin] Delivery boy ${deliveryBoyId} not found`);
      throw new Error("Delivery boy not found");
    }

    // Round pending payout for comparison
    const currentPending = Math.round((deliveryBoy.pendingAdminPayout || 0) * 100) / 100;
    console.log(`[PayToAdmin] Current pending payout in DB: ₹${currentPending}`);

    // Validate amount doesn't significantly exceed pending (using a small epsilon)
    if (amount > currentPending + 0.1) {
      console.error(`[PayToAdmin] Payment mismatch: Paid ₹${amount}, Pending ₹${currentPending}`);
      throw new Error(
        `Payment amount (₹${amount}) exceeds pending admin payout (₹${currentPending})`
      );
    }

    // Record transaction first
    const reference = `PAYOUT-${merchantTransactionId}`;
    const transaction = new WalletTransaction({
      userId: deliveryBoyId,
      userType: "DELIVERY_BOY",
      amount: amount,
      type: "Debit",
      description: "Payout to Admin via PhonePe",
      status: "Completed",
      reference,
    });
    await transaction.save({ session });

    // Update Platform Wallet
    const PlatformWallet = (await import("../../../models/PlatformWallet")).default;
    let platformWallet = await PlatformWallet.findOne().session(session);

    if (!platformWallet) {
      const walletArray = await PlatformWallet.create([{
        totalPlatformEarning: 0,
        currentPlatformBalance: 0,
        totalAdminEarning: 0,
        pendingFromDeliveryBoy: 0,
        sellerPendingPayouts: 0,
        deliveryBoyPendingPayouts: 0,
      }], { session });
      platformWallet = walletArray[0];
    }

    // Update Platform Wallet fields locally on the document
    if (platformWallet) {
        console.log(`[PayToAdmin] Updating platform wallet. Before: Earning=${platformWallet.totalPlatformEarning}, Balance=${platformWallet.currentPlatformBalance}, Pending=${platformWallet.pendingFromDeliveryBoy}`);
        
        platformWallet.totalPlatformEarning += amount;
        platformWallet.currentPlatformBalance += amount;
        platformWallet.pendingFromDeliveryBoy = Math.max(0, (platformWallet.pendingFromDeliveryBoy || 0) - amount);
        
        console.log(`[PayToAdmin] After update: Earning=${platformWallet.totalPlatformEarning}, Balance=${platformWallet.currentPlatformBalance}, Pending=${platformWallet.pendingFromDeliveryBoy}`);
    }

    // Distribute funds to sellers now that admin has received the money
    // Pass the wallet instance so it can be updated and saved atomically in one place
    console.log(`[PayToAdmin] Processing pending COD commissions...`);
    const payoutResult = await processPendingCODPayouts(deliveryBoyId, amount, session, platformWallet);
    console.log(`[PayToAdmin] processPendingCODPayouts result:`, payoutResult);

    // Update delivery boy after distributing
    deliveryBoy.pendingAdminPayout = Math.max(0, currentPending - amount);
    await deliveryBoy.save({ session });

    await session.commitTransaction();

    console.log(`[PayToAdmin] Transaction committed for delivery boy ${deliveryBoyId}. Paid: ${amount}`);

    console.log(`[Pay to Admin] Delivery boy ${deliveryBoyId} paid ${amount}:`, {
      newPending: deliveryBoy.pendingAdminPayout,
      processedOrders: payoutResult.processedCount,
      platformBalance: platformWallet.currentPlatformBalance,
    });

    return res.status(200).json({
      success: true,
      message: "Payout successful",
      data: {
        pendingAdminPayout: deliveryBoy.pendingAdminPayout,
        amountPaid: amount,
        platformBalance: platformWallet.currentPlatformBalance,
      },
    });
  } catch (error: any) {
    if (session.inTransaction()) {
      console.log(`[PayToAdmin] ABORTING transaction due to error.`);
      await session.abortTransaction();
    }
    console.error("❌ [PayToAdmin] Error verifying admin payout:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify payout",
      stack: error.stack
    });
  } finally {
    session.endSession();
  }
};


/**
 * Get delivery boy wallet transactions
 */
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const deliveryBoyId = req.user!.userId;
    const { page = 1, limit = 20 } = req.query;

    const result = await getWalletTransactions(
      deliveryBoyId,
      "DELIVERY_BOY",
      Number(page),
      Number(limit),
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error getting wallet transactions:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get wallet transactions",
    });
  }
};

/**
 * Request withdrawal
 */
export const requestWithdrawal = async (req: Request, res: Response) => {
  try {
    const deliveryBoyId = req.user!.userId;
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal amount",
      });
    }

    if (!paymentMethod || !["Bank Transfer", "UPI"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const result = await createWithdrawalRequest(
      deliveryBoyId,
      "DELIVERY_BOY",
      amount,
      paymentMethod,
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error: any) {
    console.error("Error requesting withdrawal:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to request withdrawal",
    });
  }
};

/**
 * Get delivery boy withdrawal requests
 */
export const getWithdrawals = async (req: Request, res: Response) => {
  try {
    const deliveryBoyId = req.user!.userId;
    const { status } = req.query;

    const result = await getWithdrawalRequests(
      deliveryBoyId,
      "DELIVERY_BOY",
      status as string,
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error getting withdrawal requests:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get withdrawal requests",
    });
  }
};

/**
 * Get delivery boy commission earnings
 */
export const getCommissions = async (req: Request, res: Response) => {
  try {
    const deliveryBoyId = req.user!.userId;

    const result = await getCommissionSummary(deliveryBoyId, "DELIVERY_BOY");

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error getting commission earnings:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get commission earnings",
    });
  }
};
