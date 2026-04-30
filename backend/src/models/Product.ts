import mongoose, { Document, Schema } from "mongoose";
import { ILocationData, LocationSchema } from "./schemas/LocationSchema";

export interface IProduct extends Document {
  // Basic Info
  productName: string;
  smallDescription?: string;
  description?: string;

  // Categorization
  category: mongoose.Types.ObjectId;
  subcategory?: mongoose.Types.ObjectId;
  subSubCategory?: mongoose.Types.ObjectId;
  headerCategoryId?: mongoose.Types.ObjectId;
  brand?: mongoose.Types.ObjectId;

  // Seller Info
  seller: mongoose.Types.ObjectId;

  // Images
  mainImage?: string;
  galleryImages: string[];
  productVideoUrl?: string;

  // Pricing & Inventory
  price: number;
  discPrice?: number;
  compareAtPrice?: number;
  stock: number;
  sku?: string;
  barcode?: string;

  // Status Flags
  publish: boolean;
  popular: boolean;
  dealOfDay: boolean;
  status: "Active" | "Inactive" | "Pending" | "Rejected";

  // Product Details
  manufacturer?: string;
  madeIn?: string;
  tax?: string;
  fssaiLicNo?: string;
  totalAllowedQuantity?: number;

  // Return Policy
  isReturnable: boolean;
  maxReturnDays?: number;

  // SEO
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
  seoImageAlt?: string;

  // Details
  pack?: string;
  shelfLife?: string;
  marketer?: string;

  // Ratings
  rating: number;
  reviewsCount: number;
  discount: number; // Calculated percentage

  returnPolicyText?: string;

  // Tags
  tags: string[];

  // Approval
  requiresApproval: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;

  // Commission
  commission?: number;

  // Shop by Store
  isShopByStoreOnly?: boolean;
  shopId?: mongoose.Types.ObjectId;

  // Category Specific Fields
  brandName?: string;
  size?: string;
  color?: string;
  fabric?: string;
  material?: string;
  gender?: string;
  quantityInsidePack?: string;
  expiryDate?: Date;
  dishName?: string;
  prepTime?: string;
  ingredients?: string;
  skinType?: string;
  modelName?: string;
  specifications?: string;
  warranty?: string;
  ageGroup?: string;
  weight?: string;
  frameType?: string;
  lensType?: string;
  power?: string;
  rentAmount?: number;
  securityDeposit?: number;
  bhk?: string;
  furnishingStatus?: string;
  areaSize?: string;
  contactNumber?: string;
  vehicleModel?: string;
  partNumber?: string;
  serviceName?: string;
  experience?: string;
  availability?: string;

  // Flexible attributes for other dynamic data
  attributes?: Record<string, any>;

  // Variations
  variations: {
    _id?: string;
    name?: string;
    value?: string;
    title?: string;
    price: number;
    discPrice: number;
    stock: number;
    status: string;
    sku?: string;
  }[];
  variationType?: string;
  colorGroupId?: string; // Links products that are part of the same color variation group

  type: "quick" | "ecommerce" | "both";
  availablePincodes?: string[];
  courierAvailable?: boolean;
  city?: string;
  pincode?: string;
  structuredLocation?: ILocationData;
  latitude?: number;
  longitude?: number;
  radius?: number;
  location?: {
    type: string;
    coordinates: number[];
  };
  shopAddress?: string;
  stockLocks: {
    userId: mongoose.Types.ObjectId;
    quantity: number;
    expiresAt: Date;
    variationId?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    // Basic Info
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    smallDescription: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // Categorization
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [
        function (this: any) {
          return !this.isShopByStoreOnly;
        },
        "Category is required",
      ],
    },
    subcategory: {
      type: Schema.Types.ObjectId,
      ref: "SubCategory",
    },
    subSubCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    headerCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "HeaderCategory",
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
    },

    // Seller Info
    seller: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: [true, "Seller is required"],
    },

    // Images
    mainImage: {
      type: String,
      trim: true,
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    productVideoUrl: {
      type: String,
      trim: true,
    },

    // Pricing & Inventory
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    discPrice: {
      type: Number,
      default: 0,
      min: [0, "Discounted price cannot be negative"],
    },
    compareAtPrice: {
      type: Number,
      min: [0, "Compare at price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    sku: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    barcode: {
      type: String,
      trim: true,
    },

    // Status Flags
    publish: {
      type: Boolean,
      default: true,
    },
    popular: {
      type: Boolean,
      default: false,
    },
    dealOfDay: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Pending", "Rejected"],
      default: "Active",
    },

    // Product Details
    manufacturer: {
      type: String,
      trim: true,
    },
    madeIn: {
      type: String,
      trim: true,
    },
    tax: {
      type: String,
      trim: true,
    },
    fssaiLicNo: {
      type: String,
      trim: true,
    },
    totalAllowedQuantity: {
      type: Number,
      min: [0, "Total allowed quantity cannot be negative"],
    },

    // Return Policy
    isReturnable: {
      type: Boolean,
      default: false,
    },
    maxReturnDays: {
      type: Number,
      min: [0, "Max return days cannot be negative"],
    },

    // SEO
    seoTitle: {
      type: String,
      trim: true,
    },
    seoKeywords: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
    seoImageAlt: {
      type: String,
      trim: true,
    },

    // Details
    pack: { type: String, trim: true },
    shelfLife: { type: String, trim: true },
    marketer: { type: String, trim: true },

    // Ratings
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },

    returnPolicyText: { type: String, trim: true },

    // Tags
    tags: {
      type: [String],
      default: [],
    },

    // Approval
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    approvedAt: {
      type: Date,
    },

    // Commission
    commission: {
      type: Number,
      min: [0, "Commission cannot be negative"],
    },

    // Shop by Store
    isShopByStoreOnly: {
      type: Boolean,
      default: false,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
    },
    // Category Specific Fields
    brandName: { type: String, trim: true },
    size: { type: String, trim: true },
    color: { type: String, trim: true },
    fabric: { type: String, trim: true },
    material: { type: String, trim: true },
    gender: { type: String, trim: true },
    quantityInsidePack: { type: String, trim: true },
    expiryDate: { type: Date },
    dishName: { type: String, trim: true },
    prepTime: { type: String, trim: true },
    ingredients: { type: String, trim: true },
    skinType: { type: String, trim: true },
    modelName: { type: String, trim: true },
    specifications: { type: String, trim: true },
    warranty: { type: String, trim: true },
    ageGroup: { type: String, trim: true },
    weight: { type: String, trim: true },
    frameType: { type: String, trim: true },
    lensType: { type: String, trim: true },
    power: { type: String, trim: true },
    rentAmount: { type: Number },
    securityDeposit: { type: Number },
    bhk: { type: String, trim: true },
    furnishingStatus: { type: String, trim: true },
    areaSize: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    vehicleModel: { type: String, trim: true },
    partNumber: { type: String, trim: true },
    serviceName: { type: String, trim: true },
    experience: { type: String, trim: true },
    availability: { type: String, trim: true },
    // Flexible attributes for other dynamic data
    attributes: { type: Map, of: Schema.Types.Mixed, default: {} },
    // Variations
    variations: [
      {
        name: { type: String, trim: true },
        value: { type: String, trim: true },
        title: { type: String, trim: true },
        price: { type: Number, required: true, default: 0 },
        discPrice: { type: Number, default: 0 },
        stock: { type: Number, required: true, default: 0 },
        status: { type: String, default: "Available" },
        sku: { type: String, trim: true },
      },
    ],
    variationType: { type: String, trim: true },
    // Hybrid Commerce Flow
    type: {
      type: String,
      enum: ["quick", "ecommerce", "both"],
      default: "quick",
      required: true,
    },
    availablePincodes: {
      type: [String],
      default: [],
    },
    courierAvailable: {
      type: Boolean,
      default: false,
    },
    city: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    structuredLocation: {
      type: LocationSchema,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    radius: {
      type: Number,
      default: 40, // Default 40km as per previous requirements
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    shopAddress: {
      type: String,
      trim: true,
    },
    stockLocks: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "Customer" },
        quantity: { type: Number, required: true },
        expiresAt: { type: Date, required: true },
        variationId: { type: String },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for mrp (alias for compareAtPrice to match frontend)
ProductSchema.virtual("mrp").get(function () {
  return this.compareAtPrice;
});

// Calculate discount before saving
ProductSchema.pre("save", function (next) {
  const doc = this as any;

  // Validation Logic based on Type
  if (doc.type === "quick") {
    if (!doc.latitude || !doc.longitude) {
      return next(new Error("Location (latitude and longitude) is required for Quick Commerce products"));
    }
  } else if (doc.type === "ecommerce") {
    if (!doc.availablePincodes || doc.availablePincodes.length === 0) {
      return next(new Error("At least one available pincode is required for Ecommerce products"));
    }
  } else if (doc.type === "both") {
    if (!doc.latitude || !doc.longitude) {
      return next(new Error("Location is required for Hybrid products (both)"));
    }
    if (!doc.availablePincodes || doc.availablePincodes.length === 0) {
      return next(new Error("Pincodes are required for Hybrid products (both)"));
    }
  }

  // Sync location coordinates if latitude and longitude are provided
  if (doc.structuredLocation && doc.structuredLocation.coordinates) {
    doc.latitude = doc.structuredLocation.coordinates.lat;
    doc.longitude = doc.structuredLocation.coordinates.lng;
    doc.city = doc.structuredLocation.city;
    doc.pincode = doc.structuredLocation.pincode;
  }

  if (doc.latitude !== undefined && doc.longitude !== undefined) {
    doc.location = {
      type: "Point",
      coordinates: [Number(doc.longitude), Number(doc.latitude)],
    };
  }

  // Calculate discount
  if (doc.compareAtPrice && doc.compareAtPrice > doc.price) {
    doc.discount = Math.round(
      ((doc.compareAtPrice - doc.price) / doc.compareAtPrice) * 100
    );
  } else {
    doc.discount = 0;
  }

  // Auto-disable if out of stock
  if (doc.stock <= 0) {
    doc.status = "Inactive";
  }
  next();
});

// Indexes for faster queries
ProductSchema.index({ seller: 1, status: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ subcategory: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ publish: 1 });
// Compound indexes for common queries
ProductSchema.index({ status: 1, publish: 1 }); // For getProducts
ProductSchema.index({ category: 1, status: 1, publish: 1 }); // For category products
ProductSchema.index({ subcategory: 1, status: 1, publish: 1 }); // For subcategory products
ProductSchema.index({
  productName: "text",
  smallDescription: "text",
  description: "text",
  tags: "text",
  pack: "text",
  attributes: "text",
});

ProductSchema.index({
  location: "2dsphere",
});

const Product = (mongoose.models.Product as mongoose.Model<IProduct>) || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
