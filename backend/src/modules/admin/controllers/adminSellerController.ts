import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import Seller from "../../../models/Seller";

/**
 * Get all sellers (for dropdowns/lists)
 */
export const getAllSellers = asyncHandler(async (req: Request, res: Response) => {
    const { type, status } = req.query;
    
    let query: any = {};
    if (type) query.businessType = type;
    if (status) query.status = status;

    const sellers = await Seller.find(query)
        .select("sellerName storeName profile email mobile status businessType businessDetails createdAt")
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        message: "Sellers fetched successfully",
        count: sellers.length,
        data: sellers,
    });
});

/**
 * Update seller commission rate
 */
export const updateSellerCommission = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { commissionRate } = req.body;

    if (commissionRate === undefined || commissionRate < 0 || commissionRate > 100) {
        return res.status(400).json({
            success: false,
            message: "Valid commission rate (0-100) is required",
        });
    }

    const seller = await Seller.findByIdAndUpdate(
        id,
        { 
            commissionRate,
            commission: commissionRate // Sync with legacy field used in UI
        },
        { new: true, runValidators: true }
    ).select("sellerName storeName commissionRate commission");


    if (!seller) {
        return res.status(404).json({
            success: false,
            message: "Seller not found",
        });
    }

    return res.status(200).json({
        success: true,
        message: `Commission rate for ${seller.storeName} updated to ${commissionRate}%`,
        data: seller,
    });
});

