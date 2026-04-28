import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  // Payment Info
  paymentMethod: string;
  paymentGateway?: string;
  transactionId?: string; // PhonePe final transaction ID
  phonePeOrderId?: string; // PhonePe merchant transaction ID

  // Type
  paymentType: "quick" | "ecommerce" | "hotel" | "bus";

  // Amount
  amount: number;
  currency: string;

  // Status
  status: "PENDING" | "SUCCESS" | "FAILED";

  // Payment Details
  paymentDate?: Date;
  paidAt?: Date;

  // Gateway Response
  gatewayResponse?: {
    success: boolean;
    message?: string;
    rawResponse?: any;
  };

  // Refund Info
  refundAmount?: number;
  refundedAt?: Date;
  refundReason?: string;

  // Notes
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: false, // Optional because it could be a Travel booking
    },
    hotelBookingId: {
      type: Schema.Types.ObjectId,
      ref: "HotelBooking",
      required: false,
    },
    busBookingId: {
      type: Schema.Types.ObjectId,
      ref: "BusBooking",
      required: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "User ID is required"],
    },

    // Payment Info
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      trim: true,
    },
    paymentGateway: {
      type: String,
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    phonePeOrderId: {
      type: String,
      trim: true,
    },

    // Type
    paymentType: {
      type: String,
      enum: ["quick", "ecommerce", "hotel", "bus"],
      required: true,
    },

    // Amount
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },

    // Status
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },

    // Payment Details
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paidAt: {
      type: Date,
    },

    // Gateway Response
    gatewayResponse: {
      success: Boolean,
      message: String,
      rawResponse: Schema.Types.Mixed,
    },

    // Refund Info
    refundAmount: {
      type: Number,
      min: [0, "Refund amount cannot be negative"],
    },
    refundedAt: {
      type: Date,
    },
    refundReason: {
      type: String,
      trim: true,
    },

    // Notes
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries

PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paymentDate: -1 });

const Payment = (mongoose.models.Payment as mongoose.Model<IPayment>) || mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
