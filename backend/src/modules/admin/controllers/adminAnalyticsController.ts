import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import * as analyticsService from "../../../services/analyticsService";

/**
 * Get advanced admin analytics
 */
export const getAdminAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    const period = (req.query.period as string) || "7days";
    const analytics = await analyticsService.getAdminAnalytics(period);

    return res.status(200).json({
      success: true,
      message: "Admin analytics fetched successfully",
      data: analytics
    });
  }
);
