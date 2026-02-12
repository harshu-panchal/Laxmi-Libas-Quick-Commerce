import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
    // Basic Info
    serviceName: string;
    description?: string;
    shortDescription?: string;

    // Seller Info
    seller: mongoose.Types.ObjectId;

    // Category
    category: mongoose.Types.ObjectId;
    headerCategoryId?: mongoose.Types.ObjectId;

    // Pricing
    baseCharge: number;
    chargeType: 'hourly' | 'fixed' | 'perVisit';
    minCharge?: number;
    maxCharge?: number;

    // Service Details
    serviceArea?: string; // Area where service is provided
    serviceRadiusKm?: number; // Service radius in kilometers
    experience?: string; // Years of experience
    certifications?: string[]; // Certifications/licenses

    // Availability
    availability?: {
        days: string[]; // ['Monday', 'Tuesday', etc.]
        hours: {
            start: string; // '09:00'
            end: string; // '18:00'
        };
    };

    // Contact
    contactNumber?: string;
    whatsappNumber?: string;
    email?: string;

    // Images
    mainImage?: string;
    portfolioImages: string[];

    // Status
    status: 'Active' | 'Inactive' | 'Pending' | 'Rejected';
    publish: boolean;

    // Location (for service providers)
    location?: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
    address?: string;
    city?: string;

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

const ServiceSchema = new Schema<IService>(
    {
        // Basic Info
        serviceName: {
            type: String,
            required: [true, 'Service name is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        shortDescription: {
            type: String,
            trim: true,
            maxlength: 200,
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

        // Pricing
        baseCharge: {
            type: Number,
            required: [true, 'Base charge is required'],
            min: 0,
        },
        chargeType: {
            type: String,
            enum: ['hourly', 'fixed', 'perVisit'],
            default: 'fixed',
        },
        minCharge: {
            type: Number,
            min: 0,
        },
        maxCharge: {
            type: Number,
            min: 0,
        },

        // Service Details
        serviceArea: {
            type: String,
            trim: true,
        },
        serviceRadiusKm: {
            type: Number,
            min: 0,
            max: 100,
            default: 10,
        },
        experience: {
            type: String,
            trim: true,
        },
        certifications: [{
            type: String,
            trim: true,
        }],

        // Availability
        availability: {
            days: [{
                type: String,
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            }],
            hours: {
                start: String,
                end: String,
            },
        },

        // Contact
        contactNumber: {
            type: String,
            trim: true,
        },
        whatsappNumber: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },

        // Images
        mainImage: {
            type: String,
            trim: true,
        },
        portfolioImages: [{
            type: String,
            trim: true,
        }],

        // Status
        status: {
            type: String,
            enum: ['Active', 'Inactive', 'Pending', 'Rejected'],
            default: 'Pending',
        },
        publish: {
            type: Boolean,
            default: false,
        },

        // Location
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number],
                index: '2dsphere',
            },
        },
        address: {
            type: String,
            trim: true,
        },
        city: {
            type: String,
            trim: true,
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
ServiceSchema.index({ seller: 1, status: 1 });
ServiceSchema.index({ category: 1, status: 1, publish: 1 });
ServiceSchema.index({ location: '2dsphere' });
ServiceSchema.index({ city: 1, status: 1 });

const Service = mongoose.model<IService>('Service', ServiceSchema);

export default Service;
