import { Request, Response } from "express";
import AppSettings from "../models/AppSettings";

/**
 * Get public configuration like Google Maps Key
 */
export const getPublicConfig = async (req: Request, res: Response) => {
  try {
    const settings = await AppSettings.getSettings();
    
    // Only return safe, public configuration
    res.status(200).json({
      success: true,
      data: {
        appName: settings.appName,
        googleMapsKey: settings.deliveryConfig?.googleMapsKey || process.env.VITE_GOOGLE_MAPS_API_KEY || "",
        companyAddress: settings.companyAddress,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        currency: "INR",
        platformFee: settings.platformFee,
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch public config"
    });
  }
};
