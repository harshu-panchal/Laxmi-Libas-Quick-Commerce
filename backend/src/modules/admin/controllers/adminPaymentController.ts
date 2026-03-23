import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../../../utils/asyncHandler";
import PaymentMethod from "../../../models/PaymentMethod";

/**
 * Get all payment methods
 */
export const getPaymentMethods = asyncHandler(
    async (req: Request, res: Response) => {
        const { status } = req.query;

        const query: any = {
            // Only show COD and Razorpay payment methods
            $or: [
                { type: "COD" },
                { provider: { $regex: /razorpay/i } },
                { name: { $regex: /razorpay/i } }
            ]
        };

        if (status) {
            query.isActive = status === "Active";
        }

        let paymentMethods = await PaymentMethod.find(query).sort({ order: 1 });

        // If no payment methods are found, seed the defaults
        if (paymentMethods.length === 0 && !status) {
            console.log("[getPaymentMethods] No payment methods found. Seeding defaults...");
            const defaults = [
                {
                    name: "Cash On Delivery (COD)",
                    type: "COD",
                    description: "Pay when you receive your order",
                    isActive: true,
                    order: 1,
                },
                {
                    name: "Razorpay",
                    type: "Online",
                    provider: "razorpay",
                    description: "Pay securely with Razorpay",
                    isActive: true,
                    order: 2,
                    apiKey: "",
                    secretKey: "",
                }
            ];
            
            // Insert and re-fetch to get IDs
            await PaymentMethod.insertMany(defaults);
            paymentMethods = await PaymentMethod.find(query).sort({ order: 1 });
        }

        // Transform to match frontend expectation
        const transformedMethods = paymentMethods.map((pm: any) => ({
            _id: pm._id,
            name: pm.name,
            description: pm.description,
            status: pm.isActive ? "Active" : "InActive",
            hasApiKeys: pm.type === "Online" || pm.provider === "razorpay",
            provider: pm.provider,
            type: pm.type === "COD" ? "cod" : "gateway",
            // We return empty keys if select: false kept them hidden
            apiKey: pm.apiKey || "",
            secretKey: pm.secretKey || "",
        }));

        return res.status(200).json({
            success: true,
            message: "Payment methods fetched successfully",
            data: transformedMethods,
        });
    }
);

/**
 * Get payment method by ID
 */
export const getPaymentMethodById = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;

        // Support for special IDs (like what the frontend might use if it didn't fetch yet)
        let query: any;
        if (id === "cod") {
            query = { type: "COD" };
        } else if (id === "razorpay") {
            query = { $or: [{ provider: "razorpay" }, { name: "Razorpay" }] };
        } else if (mongoose.Types.ObjectId.isValid(id)) {
            query = { _id: id };
        } else {
            return res.status(404).json({ success: false, message: "Invalid Payment Method ID" });
        }

        // We explicitly select keys to return them if needed for editing (though usually we mask them)
        const paymentMethod = await PaymentMethod.findOne(query).select("+apiKey +secretKey");

        if (!paymentMethod) {
            return res.status(404).json({
                success: false,
                message: "Payment method not found",
            });
        }

        const transformedMethod = {
            _id: paymentMethod._id,
            name: paymentMethod.name,
            description: paymentMethod.description,
            status: paymentMethod.isActive ? "Active" : "InActive",
            hasApiKeys: !!paymentMethod.apiKey,
            apiKey: paymentMethod.apiKey,
            secretKey: paymentMethod.secretKey,
            provider: paymentMethod.provider,
            type: paymentMethod.type === "COD" ? "cod" : "gateway",
        };

        return res.status(200).json({
            success: true,
            message: "Payment method details fetched successfully",
            data: transformedMethod,
        });
    }
);

/**
 * Update payment method
 */
export const updatePaymentMethod = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const { description, status, apiKey, secretKey, provider } = req.body;

        let query: any;
        if (id === "cod") {
            query = { type: "COD" };
        } else if (id === "razorpay") {
            query = { $or: [{ provider: "razorpay" }, { name: "Razorpay" }] };
        } else if (mongoose.Types.ObjectId.isValid(id)) {
            query = { _id: id };
        } else {
            return res.status(404).json({ success: false, message: "Invalid Payment Method ID" });
        }

        const paymentMethod = await PaymentMethod.findOne(query);

        if (!paymentMethod) {
            return res.status(404).json({
                success: false,
                message: "Payment method not found",
            });
        }

        if (description) paymentMethod.description = description;
        if (status) paymentMethod.isActive = status === "Active";
        if (apiKey) paymentMethod.apiKey = apiKey;
        if (secretKey) paymentMethod.secretKey = secretKey;
        if (provider) paymentMethod.provider = provider;

        await paymentMethod.save();

        return res.status(200).json({
            success: true,
            message: "Payment method updated successfully",
            data: {
                _id: paymentMethod._id,
                name: paymentMethod.name,
                status: paymentMethod.isActive ? "Active" : "InActive"
            },
        });
    }
);

/**
 * Update payment method status
 */
export const updatePaymentMethodStatus = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const { status } = req.body;

        let query: any;
        if (id === "cod") {
            query = { type: "COD" };
        } else if (id === "razorpay") {
            query = { $or: [{ provider: "razorpay" }, { name: "Razorpay" }] };
        } else if (mongoose.Types.ObjectId.isValid(id)) {
            query = { _id: id };
        } else {
            return res.status(404).json({ success: false, message: "Invalid Payment Method ID" });
        }

        const paymentMethod = await PaymentMethod.findOneAndUpdate(
            query,
            { isActive: status === "Active" },
            { new: true }
        );

        if (!paymentMethod) {
            return res.status(404).json({
                success: false,
                message: "Payment method not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: `Payment method ${status === "Active" ? "activated" : "deactivated"} successfully`,
            data: {
                _id: paymentMethod._id,
                status: paymentMethod.isActive ? "Active" : "InActive"
            },
        });
    }
);
