import mongoose, { Document, Schema } from "mongoose";

export interface IPaymentIntent extends Document {
  userId: mongoose.Types.ObjectId;
  items: any[];
  address: any;
  fees: {
    platformFee: number;
    deliveryFee: number;
    ecomShippingFee: number;
  };
  couponCode?: string;
  deliveryInstructions?: string;
  tip?: number;
  total: number;
  status: "Pending" | "Completed" | "Failed";
  merchantOrderId: string;
  paymentType: "product" | "hotel" | "bus";
  createdAt: Date;
  updatedAt: Date;
}

const PaymentIntentSchema = new Schema<IPaymentIntent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    items: {
      type: [Schema.Types.Mixed],
      required: true,
    },
    address: {
      type: Schema.Types.Mixed,
      required: true,
    },
    fees: {
      platformFee: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
      ecomShippingFee: { type: Number, default: 0 },
    },
    couponCode: String,
    deliveryInstructions: String,
    tip: { type: Number, default: 0 },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },
    merchantOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentType: {
      type: String,
      enum: ["product", "hotel", "bus"],
      default: "product",
    },
  },
  {
    timestamps: true,
  }
);

const PaymentIntent =
  (mongoose.models.PaymentIntent as mongoose.Model<IPaymentIntent>) ||
  mongoose.model<IPaymentIntent>("PaymentIntent", PaymentIntentSchema);

export default PaymentIntent;
