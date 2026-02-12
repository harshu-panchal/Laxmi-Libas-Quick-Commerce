
import { Request, Response } from "express";
import Banner from "../../../models/Banner";

/**
 * Get all banners
 */
export const getBanners = async (req: Request, res: Response) => {
    try {
        const banners = await Banner.find().sort({ order: 1 });
        res.status(200).json({
            success: true,
            data: banners,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Create a new banner
 */
export const createBanner = async (req: Request, res: Response) => {
    try {
        const banner = await Banner.create(req.body);
        res.status(201).json({
            success: true,
            data: banner,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Update a banner
 */
export const updateBanner = async (req: Request, res: Response) => {
    try {
        const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found",
            });
        }
        res.status(200).json({
            success: true,
            data: banner,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Delete a banner
 */
export const deleteBanner = async (req: Request, res: Response) => {
    try {
        const banner = await Banner.findByIdAndDelete(req.params.id);
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Banner deleted successfully",
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Get active banners for public view
 */
export const getActiveBanners = async (req: Request, res: Response) => {
    try {
        const { location } = req.query;
        const query: any = { isActive: true };
        if (location) {
            query.pageLocation = (location as string).trim();
        }
        const banners = await Banner.find(query).sort({ order: 1 });
        res.status(200).json({
            success: true,
            data: banners,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
