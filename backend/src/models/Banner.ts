
import mongoose, { Schema, Document } from "mongoose";

export interface IBanner extends Document {
    imageUrl: string;
    title?: string;
    link?: string;
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

BannerSchema.index({ order: 1, isActive: 1 });

const Banner = (mongoose.models.Banner as mongoose.Model<IBanner>) || mongoose.model<IBanner>("Banner", BannerSchema);

export default Banner;
