import mongoose, { Schema, Document } from 'mongoose';

export interface IHeaderCategory extends Document {
    name: string;
    iconLibrary: string;
    iconName: string;
    slug: string;
    theme: string; // Maps to theme key for color mapping
    relatedCategory?: string; // Links to a product category
    order: number;
    status: 'Published' | 'Unpublished';
    createdAt: Date;
    updatedAt: Date;
}

const HeaderCategorySchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        iconLibrary: { type: String, required: true },
        iconName: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        theme: { type: String, required: true, default: 'all' },
        relatedCategory: { type: String, required: false },
        order: { type: Number, default: 0 },
        status: { type: String, enum: ['Published', 'Unpublished'], default: 'Published' },
    },
    { timestamps: true }
);

const HeaderCategory = (mongoose.models.HeaderCategory as mongoose.Model<IHeaderCategory>) || mongoose.model<IHeaderCategory>('HeaderCategory', HeaderCategorySchema);
export default HeaderCategory;
