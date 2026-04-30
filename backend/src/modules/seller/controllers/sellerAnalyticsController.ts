import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import * as analyticsService from "../../../services/analyticsService";

/**
 * Get advanced seller analytics
 */
export const getSellerAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const period = (req.query.period as string) || "7days";
    
    const analytics = await analyticsService.getSellerAnalytics(sellerId, period);

    return res.status(200).json({
      success: true,
      message: "Seller analytics fetched successfully",
      data: analytics
    });
  }
);
