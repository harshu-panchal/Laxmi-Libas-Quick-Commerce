import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomRent extends Document {
    // Basic Info
    title: string;
    description?: string;

    // Seller Info
    seller: mongoose.Types.ObjectId;

    // Category
    category: mongoose.Types.ObjectId;
    headerCategoryId?: mongoose.Types.ObjectId;

    // Property Details
    propertyType: 'apartment' | 'house' | 'pg' | 'hostel' | 'villa' | 'studio';
    furnishingStatus: 'furnished' | 'semi-furnished' | 'unfurnished';

    // Rooms
    bedrooms: number;
    bathrooms: number;
    balconies?: number;

    // Area
    carpetArea?: number; // in sq ft
    builtUpArea?: number; // in sq ft

    // Rent Details
    rentAmount: number;
    securityDeposit?: number;
    maintenanceCharge?: number;

    // Amenities
    amenities: string[]; // ['WiFi', 'Parking', 'Gym', 'Swimming Pool', etc.]

    // Availability
    availableFrom: Date;
    preferredTenants?: 'family' | 'bachelor' | 'any';

    // Location
    location: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
    address: string;
    city: string;
    locality?: string;
    pincode?: string;

    // Images
    mainImage?: string;
    propertyImages: string[];

    // Owner Details
    ownerName?: string;
    ownerContact?: string;
    ownerWhatsapp?: string;

    // Status
    status: 'Available' | 'Rented' | 'Inactive' | 'Pending' | 'Rejected';
    publish: boolean;

    // Ratings
    rating: number;
    reviewsCount: number;

    // Tags
    tags: string[];

    // Approval
    requiresApproval: boolean;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const RoomRentSchema = new Schema<IRoomRent>(
    {
        // Basic Info
        title: {
            type: String,
            required: [true, 'Property title is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },

        // Seller Info
        seller: {
            type: Schema.Types.ObjectId,
            ref: 'Seller',
            required: [true, 'Seller is required'],
        },

        // Category
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Category is required'],
        },
        headerCategoryId: {
            type: Schema.Types.ObjectId,
            ref: 'HeaderCategory',
        },

        // Property Details
        propertyType: {
            type: String,
            enum: ['apartment', 'house', 'pg', 'hostel', 'villa', 'studio'],
            required: [true, 'Property type is required'],
        },
        furnishingStatus: {
            type: String,
            enum: ['furnished', 'semi-furnished', 'unfurnished'],
            required: [true, 'Furnishing status is required'],
        },

        // Rooms
        bedrooms: {
            type: Number,
            required: [true, 'Number of bedrooms is required'],
            min: 0,
        },
        bathrooms: {
            type: Number,
            required: [true, 'Number of bathrooms is required'],
            min: 0,
        },
        balconies: {
            type: Number,
            min: 0,
            default: 0,
        },

        // Area
        carpetArea: {
            type: Number,
            min: 0,
        },
        builtUpArea: {
            type: Number,
            min: 0,
        },

        // Rent Details
        rentAmount: {
            type: Number,
            required: [true, 'Rent amount is required'],
            min: 0,
        },
        securityDeposit: {
            type: Number,
            min: 0,
        },
        maintenanceCharge: {
            type: Number,
            min: 0,
            default: 0,
        },

        // Amenities
        amenities: [{
            type: String,
            trim: true,
        }],

        // Availability
        availableFrom: {
            type: Date,
            required: [true, 'Available from date is required'],
        },
        preferredTenants: {
            type: String,
            enum: ['family', 'bachelor', 'any'],
            default: 'any',
        },

        // Location
        location: {
            type: {
                type: String,
                enum: ['Point'],
                required: true,
                default: 'Point',
            },
            coordinates: {
                type: [Number],
                required: true,
                index: '2dsphere',
            },
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true,
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true,
        },
        locality: {
            type: String,
            trim: true,
        },
        pincode: {
            type: String,
            trim: true,
        },

        // Images
        mainImage: {
            type: String,
            trim: true,
        },
        propertyImages: [{
            type: String,
            trim: true,
        }],

        // Owner Details
        ownerName: {
            type: String,
            trim: true,
        },
        ownerContact: {
            type: String,
            trim: true,
        },
        ownerWhatsapp: {
            type: String,
            trim: true,
        },

        // Status
        status: {
            type: String,
            enum: ['Available', 'Rented', 'Inactive', 'Pending', 'Rejected'],
            default: 'Pending',
        },
        publish: {
            type: Boolean,
            default: false,
        },

        // Ratings
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        reviewsCount: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Tags
        tags: [{
            type: String,
            trim: true,
        }],

        // Approval
        requiresApproval: {
            type: Boolean,
            default: true,
        },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: 'Admin',
        },
        approvedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
RoomRentSchema.index({ seller: 1, status: 1 });
RoomRentSchema.index({ category: 1, status: 1, publish: 1 });
RoomRentSchema.index({ location: '2dsphere' });
RoomRentSchema.index({ city: 1, status: 1 });
RoomRentSchema.index({ rentAmount: 1 });
RoomRentSchema.index({ propertyType: 1, city: 1 });

const RoomRent = mongoose.model<IRoomRent>('RoomRent', RoomRentSchema);

export default RoomRent;
