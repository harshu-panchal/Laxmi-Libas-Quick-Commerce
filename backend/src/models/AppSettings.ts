import mongoose, { Document, Schema } from "mongoose";

export interface IAppSettings extends Document {
  // App Info
  appName: string;
  appLogo?: string;
  appFavicon?: string;

  // Contact Info
  contactEmail: string;
  contactPhone: string;
  supportEmail?: string;
  supportPhone?: string;

  // Address
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyPincode?: string;
  companyCountry?: string;

  // Payment Settings
  paymentMethods: {
    cod: boolean;
    online: boolean;
    wallet: boolean;
    upi: boolean;
  };
  paymentGateways?: {
    phonepe?: {
      enabled: boolean;
      merchantId?: string;
      saltKey?: string;
      saltIndex?: string;
    };
    stripe?: {
      enabled: boolean;
      publishableKey?: string;
      secretKey?: string;
    };
  };

  // SMS Gateway Settings
  smsGateway?: {
    provider: string; // e.g., 'Twilio', 'MSG91', 'TextLocal'
    apiKey?: string;
    apiSecret?: string;
    senderId?: string;
    enabled: boolean;
  };

  // Commission Settings
  globalCommissionRate?: number;


  // Delivery Settings
  platformFee?: number;
  deliveryCharges: number;
  freeDeliveryThreshold?: number;
  deliveryConfig?: {
    isDistanceBased: boolean;
    googleMapsKey?: string;
    baseCharge: number;
    baseDistance: number;
    kmRate: number;
    deliveryBoyKmRate?: number;
    assignmentMode?: "Automatic" | "Manual";
    /** Max active orders one delivery partner can hold at once (default 3). */
    maxConcurrentOrdersPerBoy?: number;
  };

  // Tax Settings
  gstEnabled: boolean;
  gstRate?: number;

  // Policies
  privacyPolicy?: string;
  termsOfService?: string;
  returnPolicy?: string;
  refundPolicy?: string;
  customerAppPolicy?: string;
  deliveryAppPolicy?: string;

  // FAQ
  faq?: Array<{
    question: string;
    answer: string;
  }>;

  // Home Sections Configuration
  homeSections?: Array<{
    title: string;
    category?: mongoose.Types.ObjectId;
    subcategory?: mongoose.Types.ObjectId;
    city?: string;
    deliverableArea?: string;
    status: string;
    productSortBy?: string;
    productLimit?: number;
    order: number;
  }>;

  // Feature Flags
  features: {
    sellerRegistration: boolean;
    productApproval: boolean;
    orderTracking: boolean;
    wallet: boolean;
    coupons: boolean;
  };

  // Maintenance Mode
  maintenanceMode: boolean;
  maintenanceMessage?: string;

  // Updated By
  updatedBy?: mongoose.Types.ObjectId;

  // Withdrawal Settings
  minimumWithdrawalAmount?: number;
  
  // Invoice Settings
  invoicePrefix?: string;
  invoiceTagline?: string;
  invoiceFooter?: string;
  gstNumber?: string;

  // Social Links
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
  };

  // Theme Colors & Typography Settings
  themeSettings?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
    enableGlassmorphism?: boolean;
    cardStyle?: "flat" | "bordered" | "shadow" | "glass";
  };

  // Dynamic Role Access Control Config
  roleAccessConfig?: {
    hotelModuleAllowedRoles?: string[];
    busModuleAllowedRoles?: string[];
    deliveryModuleAllowedRoles?: string[];
    sellerModuleAllowedRoles?: string[];
  };

  // Dynamic UI Sections & Fields Controls
  dynamicUIControls?: {
    showHotelSection?: boolean;
    showBusSection?: boolean;
    showGrocerySection?: boolean;
    showBestsellers?: boolean;
    showPromoStrip?: boolean;
    customFooterText?: string;
    primaryButtonLabel?: string;
    checkoutFieldsRequirement?: string; // e.g. "Standard" or "Compact"
  };

  // Dynamic Buttons Customization
  dynamicButtons?: Array<{
    buttonId: string;
    label: string;
    visible: boolean;
    icon?: string;
  }>;

  // Dynamic Forms Customization
  dynamicForms?: Array<{
    formId: string;
    fields: Array<{
      fieldId: string;
      label: string;
      placeholder?: string;
      type: "text" | "number" | "date" | "email" | "select";
      required: boolean;
      visible: boolean;
    }>;
  }>;

  createdAt: Date;
  updatedAt: Date;
}

// Define the Model type with static methods
interface IAppSettingsModel extends mongoose.Model<IAppSettings> {
  getSettings(): Promise<IAppSettings>;
}

const AppSettingsSchema = new Schema<IAppSettings>(
  {
    // ... (rest of schema is fine, just adding new field)

    // Withdrawal Settings
    minimumWithdrawalAmount: {
      type: Number,
      default: 100
    },

    // App Info
    appName: {
      type: String,
      trim: true,
    },
    appFavicon: {
      type: String,
      trim: true,
    },

    // Contact Info
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      trim: true,
    },
    contactPhone: {
      type: String,
      required: [true, "Contact phone is required"],
      trim: true,
    },
    supportEmail: {
      type: String,
      trim: true,
    },
    supportPhone: {
      type: String,
      trim: true,
    },

    // Address
    companyAddress: {
      type: String,
      trim: true,
    },
    companyCity: {
      type: String,
      trim: true,
    },
    companyState: {
      type: String,
      trim: true,
    },
    companyPincode: {
      type: String,
      trim: true,
    },
    companyCountry: {
      type: String,
      default: "India",
      trim: true,
    },

    // Payment Settings
    paymentMethods: {
      cod: {
        type: Boolean,
        default: true,
      },
      online: {
        type: Boolean,
        default: true,
      },
      wallet: {
        type: Boolean,
        default: true,
      },
      upi: {
        type: Boolean,
        default: true,
      },
    },
    paymentGateways: {
      phonepe: {
        enabled: Boolean,
        merchantId: String,
        saltKey: String,
        saltIndex: String,
      },
      stripe: {
        enabled: Boolean,
        publishableKey: String,
        secretKey: String,
      },
    },

    // SMS Gateway Settings
    smsGateway: {
      provider: {
        type: String,
        trim: true,
      },
      apiKey: {
        type: String,
        trim: true,
      },
      apiSecret: {
        type: String,
        trim: true,
      },
      senderId: {
        type: String,
        trim: true,
      },
      enabled: {
        type: Boolean,
        default: false,
      },
    },

    // Commission Settings
    globalCommissionRate: {
      type: Number,
      default: 10,
      min: [0, "Commission rate cannot be negative"],
      max: [100, "Commission rate cannot exceed 100%"],
    },


    // Delivery Settings
    platformFee: {
      type: Number,
      default: 2,
      min: [0, "Platform fee cannot be negative"],
    },
    deliveryCharges: {
      type: Number,
      default: 0,
      min: [0, "Delivery charges cannot be negative"],
    },
    freeDeliveryThreshold: {
      type: Number,
      min: [0, "Free delivery threshold cannot be negative"],
    },
    deliveryConfig: {
      isDistanceBased: { type: Boolean, default: false },
      googleMapsKey: { type: String, trim: true },
      baseCharge: { type: Number, default: 0 },
      baseDistance: { type: Number, default: 0 },
      kmRate: { type: Number, default: 0 },
      deliveryBoyKmRate: { type: Number, default: 0 },
      assignmentMode: {
        type: String,
        enum: ["Automatic", "Manual"],
        default: "Automatic",
      },
      maxConcurrentOrdersPerBoy: {
        type: Number,
        default: 3,
        min: [1, "Must allow at least 1 concurrent order"],
        max: [10, "Cannot exceed 10 concurrent orders"],
      },
    },
    // Tax Settings
    gstEnabled: {
      type: Boolean,
      default: false,
    },
    gstRate: {
      type: Number,
      min: [0, "GST rate cannot be negative"],
      max: [100, "GST rate cannot exceed 100%"],
    },

    // Policies
    privacyPolicy: {
      type: String,
      trim: true,
    },
    termsOfService: {
      type: String,
      trim: true,
    },
    returnPolicy: {
      type: String,
      trim: true,
    },
    refundPolicy: {
      type: String,
      trim: true,
    },
    customerAppPolicy: {
      type: String,
      trim: true,
    },
    deliveryAppPolicy: {
      type: String,
      trim: true,
    },

    // FAQ
    faq: [
      {
        question: {
          type: String,
          required: true,
          trim: true,
        },
        answer: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],

    // Home Sections Configuration
    homeSections: [
      {
        title: String,
        category: {
          type: Schema.Types.ObjectId,
          ref: "Category",
        },
        subcategory: {
          type: Schema.Types.ObjectId,
          ref: "SubCategory",
        },
        city: String,
        deliverableArea: String,
        status: String,
        productSortBy: String,
        productLimit: Number,
        order: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Feature Flags
    features: {
      sellerRegistration: {
        type: Boolean,
        default: true,
      },
      productApproval: {
        type: Boolean,
        default: true,
      },
      orderTracking: {
        type: Boolean,
        default: true,
      },
      wallet: {
        type: Boolean,
        default: true,
      },
      coupons: {
        type: Boolean,
        default: true,
      },
    },

    // Maintenance Mode
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      trim: true,
    },

    // Updated By
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },

    // Invoice Settings
    invoicePrefix: { type: String, default: "INV", trim: true },
    invoiceTagline: { type: String, default: "Fast Delivery E-Commerce Platform", trim: true },
    invoiceFooter: { type: String, default: "Thank you for your business!", trim: true },
    gstNumber: { type: String, trim: true },

    // Social Links
    socialLinks: {
      facebook: String,
      instagram: String,
      twitter: String,
      whatsapp: String,
    },

    // Theme Customization
    themeSettings: {
      primaryColor: { type: String, default: "#0d9488" },
      secondaryColor: { type: String, default: "#f59e0b" },
      backgroundColor: { type: String, default: "#ffffff" },
      textColor: { type: String, default: "#1f2937" },
      fontFamily: { type: String, default: "Outfit" },
      enableGlassmorphism: { type: Boolean, default: true },
      cardStyle: { type: String, enum: ["flat", "bordered", "shadow", "glass"], default: "shadow" },
    },

    // Dynamic Permission & Module Access Control
    roleAccessConfig: {
      hotelModuleAllowedRoles: { type: [String], default: ["Super Admin", "Admin", "hotel"] },
      busModuleAllowedRoles: { type: [String], default: ["Super Admin", "Admin", "bus"] },
      deliveryModuleAllowedRoles: { type: [String], default: ["Super Admin", "Admin", "delivery", "Delivery"] },
      sellerModuleAllowedRoles: { type: [String], default: ["Super Admin", "Admin", "seller", "Seller"] },
    },

    // Dynamic Home Banner & Feature Section Controls
    dynamicUIControls: {
      showHotelSection: { type: Boolean, default: true },
      showBusSection: { type: Boolean, default: true },
      showGrocerySection: { type: Boolean, default: true },
      showBestsellers: { type: Boolean, default: true },
      showPromoStrip: { type: Boolean, default: true },
      customFooterText: { type: String, default: "© 2026 Laxmart. All Rights Reserved." },
      primaryButtonLabel: { type: String, default: "Explore Now" },
      checkoutFieldsRequirement: { type: String, default: "Standard" },
    },

    // Dynamic Buttons Customization
    dynamicButtons: [
      {
        buttonId: { type: String, required: true },
        label: { type: String, required: true },
        visible: { type: Boolean, default: true },
        icon: { type: String, default: "ArrowRight" }
      }
    ],

    // Dynamic Forms Customization
    dynamicForms: [
      {
        formId: { type: String, required: true },
        fields: [
          {
            fieldId: { type: String, required: true },
            label: { type: String, required: true },
            placeholder: String,
            type: { type: String, enum: ["text", "number", "date", "email", "select"], default: "text" },
            required: { type: Boolean, default: false },
            visible: { type: Boolean, default: true }
          }
        ]
      }
    ],
  },
  {
    timestamps: true,
  },
);

// Ensure only one settings document exists
AppSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      appName: "LaxMart",
      contactEmail: "contact@laxmart.store",
      contactPhone: "1234567890",
      deliveryConfig: {
        isDistanceBased: false,
        googleMapsKey: process.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyBwY-YpAy3lHQb1FAHIDne2Cu_Q_hVEEVM",
        baseCharge: 0,
        baseDistance: 0,
        kmRate: 0,
        assignmentMode: "Automatic"
      },
      dynamicButtons: [
        { buttonId: "bookHotel", label: "Book Room", visible: true, icon: "Calendar" },
        { buttonId: "searchBus", label: "Search Buses", visible: true, icon: "Search" },
        { buttonId: "addCart", label: "Add to Cart", visible: true, icon: "ShoppingBag" }
      ],
      dynamicForms: [
        {
          formId: "hotelBookingForm",
          fields: [
            { fieldId: "guestName", label: "Primary Guest Name", placeholder: "Enter guest name", type: "text", required: true, visible: true },
            { fieldId: "guestEmail", label: "Guest Email", placeholder: "Enter guest email", type: "email", required: true, visible: true },
            { fieldId: "guestPhone", label: "Guest Phone Number", placeholder: "10-digit number", type: "text", required: true, visible: true },
            { fieldId: "specialRequests", label: "Special Requests (Optional)", placeholder: "e.g., Early check-in, late check-out", type: "text", required: false, visible: true }
          ]
        },
        {
          formId: "busBookingForm",
          fields: [
            { fieldId: "passengerName", label: "Passenger Full Name", placeholder: "As on ID card", type: "text", required: true, visible: true },
            { fieldId: "passengerGender", label: "Gender", placeholder: "Male/Female/Other", type: "select", required: true, visible: true },
            { fieldId: "passengerAge", label: "Age", placeholder: "Enter age", type: "number", required: true, visible: true }
          ]
        }
      ]
    });
  }
  return settings;
};

// Indexes
AppSettingsSchema.index({ appName: 1 });

const AppSettings = (mongoose.models.AppSettings as IAppSettingsModel) || mongoose.model<IAppSettings, IAppSettingsModel>(
  "AppSettings",
  AppSettingsSchema,
);

export default AppSettings;
