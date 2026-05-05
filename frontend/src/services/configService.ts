import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface AppConfig {
    appName: string;
    appLogo?: string;
    appFavicon?: string;
    deliveryFee: number;
    freeDeliveryThreshold: number;
    platformFee: number;
    currency: string;
    companyAddress?: string;
    contactEmail?: string;
    contactPhone?: string;
    supportEmail?: string;
    supportPhone?: string;
    invoicePrefix: string;
    invoiceTagline: string;
    invoiceFooter: string;
    gstNumber?: string;
    socialLinks?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        whatsapp?: string;
    };
    taxes: {
        gst: number;
    };
    estimatedDeliveryTime: string;
}

// Default configuration (fallback)
const defaultConfig: AppConfig = {
    appName: 'LaxMart',
    deliveryFee: 40,
    freeDeliveryThreshold: 199,
    platformFee: 2,
    currency: 'INR',
    invoicePrefix: 'INV',
    invoiceTagline: 'Fast Delivery E-Commerce Platform',
    invoiceFooter: 'Thank you for your business!',
    taxes: {
        gst: 18
    },
    estimatedDeliveryTime: '12-15 mins'
};

let cachedConfig: AppConfig | null = null;

/**
 * Get application configuration
 */
export const getAppConfig = async (): Promise<AppConfig> => {
    if (cachedConfig) return cachedConfig;

    try {
        const response = await axios.get(`${API_URL}/config/public`);
        if (response.data && response.data.success) {
            const remoteData = response.data.data;
            cachedConfig = {
                ...defaultConfig,
                ...remoteData,
                deliveryFee: remoteData.deliveryCharges ?? defaultConfig.deliveryFee,
                taxes: {
                    gst: remoteData.gstRate ?? defaultConfig.taxes.gst
                }
            };
            return cachedConfig!;
        }
    } catch (error) {
        console.error('Failed to fetch remote config, using defaults:', error);
    }
    
    return defaultConfig;
};

// Synchronous helper (deprecated, use getAppConfig instead for dynamic data)
export const appConfig = defaultConfig;
