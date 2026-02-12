import { Request, Response } from 'express';
import { Service, Seller } from '../../../models';
import { uploadToCloudinary } from '../../../services/cloudinaryService';

// Create a new service
export const createService = async (req: Request, res: Response) => {
    try {
        const sellerId = req.user?.userId;

        if (!sellerId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        // Verify seller exists and is approved
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found',
            });
        }

        if (seller.status !== 'Approved') {
            return res.status(403).json({
                success: false,
                message: 'Your account must be approved to add services',
            });
        }


        const {
            serviceName,
            description,
            category,
            baseCharge,
            chargeType,
            serviceArea,
            experience,
            certifications,
            availability,
            contactNumber,
            address,
            city,
        } = req.body;

        // Validate required fields
        if (!serviceName || !category || !baseCharge || !chargeType) {
            return res.status(400).json({
                success: false,
                message: 'Service name, category, base charge, and charge type are required',
            });
        }

        // Handle portfolio images upload
        let portfolioImages: string[] = [];
        if (req.files && Array.isArray(req.files)) {
            const uploadPromises = req.files.map((file: any) =>
                uploadToCloudinary(file.buffer, 'services')
            );
            const uploadResults = await Promise.all(uploadPromises);
            portfolioImages = uploadResults.map((result) => result.secure_url);
        }

        // Strict Category Validation: Ensure service category matches seller's assigned category
        const sellerCategoryId = (req as any).user.categoryId;
        if (!sellerCategoryId) {
            return res.status(403).json({
                success: false,
                message: "You do not have a category assigned. Please contact admin.",
            });
        }

        if (category && category.toString() !== sellerCategoryId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only upload services for your assigned category",
            });
        }

        // Create service
        const service = await Service.create({
            serviceName,
            description,
            seller: sellerId,
            category: sellerCategoryId, // Force the assigned category
            baseCharge,
            chargeType,
            serviceArea,
            experience,
            certifications: certifications || [],
            availability,
            contactNumber: contactNumber || seller.mobile,
            portfolioImages,
            address,
            city: city || seller.city,
            status: seller.requireProductApproval ? 'Pending' : 'Active',
            requiresApproval: seller.requireProductApproval,
        });

        return res.status(201).json({
            success: true,
            message: 'Service created successfully',
            data: service,
        });
    } catch (error: any) {
        console.error('Error creating service:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create service',
            error: error.message,
        });
    }
};

// Get all services for a seller
export const getSellerServices = async (req: Request, res: Response) => {
    try {
        const sellerId = req.user?.userId;

        if (!sellerId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        const { status, page = 1, limit = 10 } = req.query;

        const query: any = { seller: sellerId };
        if (status) {
            query.status = status;
        }

        const services = await Service.find(query)
            .populate('category', 'name slug')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await Service.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: services,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error: any) {
        console.error('Error fetching services:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch services',
            error: error.message,
        });
    }
};

// Get service by ID
export const getServiceById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const sellerId = req.user?.userId;

        const service = await Service.findById(id)
            .populate('category', 'name slug')
            .populate('seller', 'sellerName storeName mobile email');

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found',
            });
        }

        // Verify ownership
        if (service.seller._id.toString() !== sellerId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this service',
            });
        }

        return res.status(200).json({
            success: true,
            data: service,
        });
    } catch (error: any) {
        console.error('Error fetching service:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch service',
            error: error.message,
        });
    }
};

// Update service
export const updateService = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const sellerId = req.user?.userId;

        const service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found',
            });
        }

        // Verify ownership
        if (service.seller.toString() !== sellerId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this service',
            });
        }

        const {
            serviceName,
            description,
            category,
            baseCharge,
            chargeType,
            serviceArea,
            experience,
            certifications,
            availability,
            contactNumber,
            address,
            city,
            status,
        } = req.body;

        // Handle new portfolio images
        let newPortfolioImages: string[] = [];
        if (req.files && Array.isArray(req.files)) {
            const uploadPromises = req.files.map((file: any) =>
                uploadToCloudinary(file.buffer, 'services')
            );
            const uploadResults = await Promise.all(uploadPromises);
            newPortfolioImages = uploadResults.map((result) => result.secure_url);
        }

        // Strict Category Validation for updates
        const sellerCategoryId = (req as any).user.categoryId;
        if (category && category.toString() !== sellerCategoryId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You cannot change the service category to one outside your assignment",
            });
        }

        // Update fields
        if (serviceName) service.serviceName = serviceName;
        if (description) service.description = description;
        if (category) service.category = sellerCategoryId; // Force assigned category
        if (baseCharge) service.baseCharge = baseCharge;
        if (chargeType) service.chargeType = chargeType;
        if (serviceArea) service.serviceArea = serviceArea;
        if (experience) service.experience = experience;
        if (certifications) service.certifications = certifications;
        if (availability) service.availability = availability;
        if (contactNumber) service.contactNumber = contactNumber;
        if (address) service.address = address;
        if (city) service.city = city;
        if (status) service.status = status;

        // Append new images to existing ones
        if (newPortfolioImages.length > 0) {
            service.portfolioImages = [...service.portfolioImages, ...newPortfolioImages];
        }

        await service.save();

        return res.status(200).json({
            success: true,
            message: 'Service updated successfully',
            data: service,
        });
    } catch (error: any) {
        console.error('Error updating service:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update service',
            error: error.message,
        });
    }
};

// Delete service
export const deleteService = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const sellerId = req.user?.userId;

        const service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found',
            });
        }

        // Verify ownership
        if (service.seller.toString() !== sellerId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this service',
            });
        }

        await Service.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Service deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting service:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete service',
            error: error.message,
        });
    }
};

// Toggle service status (Active/Inactive)
export const toggleServiceStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const sellerId = req.user?.userId;

        const service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found',
            });
        }

        // Verify ownership
        if (service.seller.toString() !== sellerId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to modify this service',
            });
        }

        service.status = service.status === 'Active' ? 'Inactive' : 'Active';
        await service.save();

        return res.status(200).json({
            success: true,
            message: `Service ${service.status === 'Active' ? 'activated' : 'deactivated'} successfully`,
            data: service,
        });
    } catch (error: any) {
        console.error('Error toggling service status:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to toggle service status',
            error: error.message,
        });
    }
};
