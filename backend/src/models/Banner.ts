
import mongoose, { Schema, Document } from "mongoose";

export interface IBanner extends Document {
    imageUrl: string;
    title?: string;
    link?: string;
    redirectUrl?: string;
    redirectType?: 'product' | 'category' | 'external' | 'hotel' | 'bus' | 'quick' | 'none';
    order: number;
    isActive: boolean;
    pageLocation: string; // "Home Page", "Category Page", etc.
    createdAt: Date;
    updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
    {
        imageUrl: {
            type: String,
            required: [true, "Image URL is required"],
        },
        title: {
            type: String,
            trim: true,
        },
        link: {
            type: String,
            trim: true,
        },
        redirectUrl: {
            type: String,
            trim: true,
        },
        redirectType: {
            type: String,
            enum: ['product', 'category', 'external', 'hotel', 'bus', 'quick', 'none'],
            default: 'none',
        },
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        pageLocation: {
            type: String,
            default: "Home Page",
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

BannerSchema.pre("save", function (next) {
    if (this.redirectUrl && !this.link) {
        this.link = this.redirectUrl;
    }
    if (this.link && !this.redirectUrl) {
        this.redirectUrl = this.link;
    }
    next();
});

BannerSchema.index({ order: 1, isActive: 1 });

const Banner = (mongoose.models.Banner as mongoose.Model<IBanner>) || mongoose.model<IBanner>("Banner", BannerSchema);

export default Banner;
