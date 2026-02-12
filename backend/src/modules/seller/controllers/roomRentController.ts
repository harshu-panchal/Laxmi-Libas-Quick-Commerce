import { Request, Response } from 'express';
import { RoomRent, Seller } from '../../../models';
import { uploadToCloudinary } from '../../../services/cloudinaryService';

// Create a new room rent listing
export const createRoomRent = async (req: Request, res: Response) => {
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
                message: 'Your account must be approved to add rental listings',
            });
        }


        const {
            title,
            propertyType,
            furnishingStatus,
            bedrooms,
            bathrooms,
            rentAmount,
            securityDeposit,
            amenities,
            availableFrom,
            location,
            address,
            city,
            pincode,
            ownerName,
            ownerContact,
            description,
        } = req.body;

        // Validate required fields
        if (!title || !propertyType || !furnishingStatus || !bedrooms || !rentAmount || !city) {
            return res.status(400).json({
                success: false,
                message: 'Title, property type, furnishing status, bedrooms, rent amount, and city are required',
            });
        }

        // Handle property images upload
        let propertyImages: string[] = [];
        if (req.files && Array.isArray(req.files)) {
            const uploadPromises = req.files.map((file: any) =>
                uploadToCloudinary(file.buffer, 'room-rent')
            );
            const uploadResults = await Promise.all(uploadPromises);
            propertyImages = uploadResults.map((result) => result.secure_url);
        }

        // Strict Category Validation: Ensure room rent category matches seller's assigned category
        const sellerCategoryId = (req as any).user.categoryId;
        if (!sellerCategoryId) {
            return res.status(403).json({
                success: false,
                message: "You do not have a category assigned. Please contact admin.",
            });
        }

        // Create room rent listing
        const roomRent = await RoomRent.create({
            title,
            seller: sellerId,
            category: sellerCategoryId, // Force assigned category
            propertyType,
            furnishingStatus,
            bedrooms,
            bathrooms: bathrooms || 1,
            rentAmount,
            securityDeposit,
            amenities: amenities || [],
            availableFrom: availableFrom || new Date(),
            location,
            address,
            city,
            pincode,
            ownerName: ownerName || seller.sellerName,
            ownerContact: ownerContact || seller.mobile,
            description,
            propertyImages,
            status: seller.requireProductApproval ? 'Pending' : 'Available',
            requiresApproval: seller.requireProductApproval,
        });

        return res.status(201).json({
            success: true,
            message: 'Room rent listing created successfully',
            data: roomRent,
        });
    } catch (error: any) {
        console.error('Error creating room rent listing:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create room rent listing',
            error: error.message,
        });
    }
};

// Get all room rent listings for a seller
export const getSellerRoomRents = async (req: Request, res: Response) => {
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

        const roomRents = await RoomRent.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await RoomRent.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: roomRents,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error: any) {
        console.error('Error fetching room rent listings:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch room rent listings',
            error: error.message,
        });
    }
};

// Get room rent listing by ID
export const getRoomRentById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const sellerId = req.user?.userId;

        const roomRent = await RoomRent.findById(id).populate('seller', 'sellerName storeName mobile email');

        if (!roomRent) {
            return res.status(404).json({
                success: false,
                message: 'Room rent listing not found',
            });
        }

        // Verify ownership
        if (roomRent.seller._id.toString() !== sellerId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this listing',
            });
        }

        return res.status(200).json({
            success: true,
            data: roomRent,
        });
    } catch (error: any) {
        console.error('Error fetching room rent listing:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch room rent listing',
            error: error.message,
        });
    }
};

// Update room rent listing
export const updateRoomRent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const sellerId = req.user?.userId;

        const roomRent = await RoomRent.findById(id);

        if (!roomRent) {
            return res.status(404).json({
                success: false,
                message: 'Room rent listing not found',
            });
        }

        // Verify ownership
        if (roomRent.seller.toString() !== sellerId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this listing',
            });
        }

        const {
            title,
            propertyType,
            furnishingStatus,
            bedrooms,
            bathrooms,
            rentAmount,
            securityDeposit,
            amenities,
            availableFrom,
            location,
            address,
            city,
            pincode,
            ownerName,
            ownerContact,
            description,
            status,
        } = req.body;

        // Handle new property images
        let newPropertyImages: string[] = [];
        if (req.files && Array.isArray(req.files)) {
            const uploadPromises = req.files.map((file: any) =>
                uploadToCloudinary(file.buffer, 'room-rent')
            );
            const uploadResults = await Promise.all(uploadPromises);
            newPropertyImages = uploadResults.map((result) => result.secure_url);
        }

        // Strict Category Validation for updates
        const sellerCategoryId = (req as any).user.categoryId;

        // Update fields
        if (title) roomRent.title = title;
        if (propertyType) roomRent.propertyType = propertyType;
        if (furnishingStatus) roomRent.furnishingStatus = furnishingStatus;
        if (category) roomRent.category = sellerCategoryId; // Force assigned category        if (bedrooms) roomRent.bedrooms = bedrooms;
        if (bathrooms) roomRent.bathrooms = bathrooms;
        if (rentAmount) roomRent.rentAmount = rentAmount;
        if (securityDeposit !== undefined) roomRent.securityDeposit = securityDeposit;
        if (amenities) roomRent.amenities = amenities;
        if (availableFrom) roomRent.availableFrom = availableFrom;
        if (location) roomRent.location = location;
        if (address) roomRent.address = address;
        if (city) roomRent.city = city;
        if (pincode) roomRent.pincode = pincode;
        if (ownerName) roomRent.ownerName = ownerName;
        if (ownerContact) roomRent.ownerContact = ownerContact;
        if (description) roomRent.description = description;
        if (status) roomRent.status = status;

        // Append new images to existing ones
        if (newPropertyImages.length > 0) {
            roomRent.propertyImages = [...roomRent.propertyImages, ...newPropertyImages];
        }

        await roomRent.save();

        return res.status(200).json({
            success: true,
            message: 'Room rent listing updated successfully',
            data: roomRent,
        });
    } catch (error: any) {
        console.error('Error updating room rent listing:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update room rent listing',
            error: error.message,
        });
    }
};

// Delete room rent listing
export const deleteRoomRent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const sellerId = req.user?.userId;

        const roomRent = await RoomRent.findById(id);

        if (!roomRent) {
            return res.status(404).json({
                success: false,
                message: 'Room rent listing not found',
            });
        }

        // Verify ownership
        if (roomRent.seller.toString() !== sellerId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this listing',
            });
        }

        await RoomRent.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Room rent listing deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting room rent listing:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete room rent listing',
            error: error.message,
        });
    }
};

// Toggle listing status (Available/Rented)
export const toggleRoomRentStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const sellerId = req.user?.userId;

        const roomRent = await RoomRent.findById(id);

        if (!roomRent) {
            return res.status(404).json({
                success: false,
                message: 'Room rent listing not found',
            });
        }

        // Verify ownership
        if (roomRent.seller.toString() !== sellerId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to modify this listing',
            });
        }

        roomRent.status = roomRent.status === 'Available' ? 'Rented' : 'Available';
        await roomRent.save();

        return res.status(200).json({
            success: true,
            message: `Listing marked as ${roomRent.status.toLowerCase()}`,
            data: roomRent,
        });
    } catch (error: any) {
        console.error('Error toggling listing status:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to toggle listing status',
            error: error.message,
        });
    }
};
