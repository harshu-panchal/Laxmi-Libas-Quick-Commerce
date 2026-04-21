import mongoose, { Document, Schema } from 'mongoose';

export interface IDiscountRule extends Document {
    minQty: number;
    discountPercent: number;
    categoryId?: mongoose.Types.ObjectId;
    sellerId?: mongoose.Types.ObjectId;
    productId?: mongoose.Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const DiscountRuleSchema = new Schema<IDiscountRule>({
    minQty: { type: Number, required: true, min: 1 },
    discountPercent: { type: Number, required: true, min: 0, max: 100 },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', default: null },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    usageLimit: { type: Number, default: 0 }, // 0 means unlimited
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const DiscountRule = mongoose.models.DiscountRule || mongoose.model<IDiscountRule>('DiscountRule', DiscountRuleSchema);
export default DiscountRule;
