import api from './config';
import { Product } from './productService'; // Reuse generic product type if compatible or define new one
import { apiCache } from '../../utils/apiCache';

export interface Category {
    _id: string; // MongoDB ID
    id?: string; // Virtual ID
    name: string;
    parent?: string | null;
    image?: string;
    icon?: string;
    description?: string;
    isActive: boolean;
    children?: Category[];
    subcategories?: Category[];
    headerCategoryId?: string | { _id: string; name?: string };
    totalProducts?: number;
}

export interface GetProductsParams {
    search?: string;
    category?: string;
    subcategory?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'price_asc' | 'price_desc' | 'popular' | 'discount';
    page?: number;
    limit?: number;
    latitude?: number; // User location latitude
    longitude?: number; // User location longitude
    city?: string; // User location city
}

export interface ProductListResponse {
    success: boolean;
    data: Product[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface ProductDetailResponse {
    success: boolean;
    message?: string;
    data: Product & { 
        similarProducts?: Product[];
        colorVariations?: any[];
        isAvailableAtLocation?: boolean;
    };
}

export interface CategoryListResponse {
    success: boolean;
    data: Category[];
}

/**
 * Get products with filters (Public)
 * Location (latitude/longitude) is required to filter products by seller's service radius
 */
export const getProducts = async (params?: GetProductsParams, useCache: boolean = true): Promise<ProductListResponse> => {
    const cacheKey = `products-${JSON.stringify(params || {})}`;
    
    const fetchFn = async () => {
        const response = await api.get<ProductListResponse>('/customer/products', { params });
        
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
            // Global filter to hide mock/placeholder products
            const isMockProduct = (p: any) => 
                ((p.imageUrl || "").includes('10mins_icon_pink') || (p.mainImage || "").includes('10mins_icon_pink'));

            response.data.data = response.data.data.filter(p => !isMockProduct(p));
        }
        return response.data;
    };

    if (useCache) {
        return apiCache.getOrFetch(cacheKey, fetchFn, 30 * 1000); // 30 seconds cache TTL
    }
    return fetchFn();
};

/**
 * Get only Quick Commerce products (for Quick section)
 */
export const getQuickProducts = async (params?: GetProductsParams, useCache: boolean = true): Promise<ProductListResponse> => {
    const cacheKey = `quick-products-${JSON.stringify(params || {})}`;
    
    const fetchFn = async () => {
        const response = await api.get<ProductListResponse>('/customer/products/quick', { params });
        
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
            // Global filter to hide mock/placeholder products
            const isMockProduct = (p: any) => 
                ((p.imageUrl || "").includes('10mins_icon_pink') || (p.mainImage || "").includes('10mins_icon_pink'));

            response.data.data = response.data.data.filter(p => !isMockProduct(p));
        }
        return response.data;
    };

    if (useCache) {
        return apiCache.getOrFetch(cacheKey, fetchFn, 15 * 1000); // 15 seconds cache TTL
    }
    return fetchFn();
};

/**
 * Get product details by ID (Public)
 * Location (latitude/longitude) is required to verify product availability
 */
export const getProductById = async (id: string, latitude?: number, longitude?: number): Promise<ProductDetailResponse> => {
    const params: any = {};
    if (latitude !== undefined && longitude !== undefined) {
        params.latitude = latitude;
        params.longitude = longitude;
    }
    const response = await api.get<ProductDetailResponse>(`/customer/products/${id}`, { params });
    if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.similarProducts)) {
        // Global filter to hide mock/placeholder products
        const isMockProduct = (p: any) => 
            ((p.imageUrl || "").includes('10mins_icon_pink') || (p.mainImage || "").includes('10mins_icon_pink'));

        response.data.data.similarProducts = response.data.data.similarProducts.filter(p => !isMockProduct(p));
    }
    
    return response.data;
};

/**
 * Get category details by ID or slug (Public)
 */
export const getCategoryById = async (id: string, useCache: boolean = true): Promise<any> => {
    const cacheKey = `category-detail-${id}`;
    
    const fetchFn = async () => {
        const response = await api.get<any>(`/customer/categories/${id}`);
        return response.data;
    };

    if (useCache) {
        return apiCache.getOrFetch(cacheKey, fetchFn, 5 * 60 * 1000); // 5 minutes cache TTL
    }
    return fetchFn();
};

/**
 * Get all categories (Public)
 * Using /tree endpoint to get hierarchy if available, otherwise just /
 * Cached for 10 minutes as categories don't change frequently
 */
export const getCategories = async (tree: boolean = false): Promise<CategoryListResponse> => {
    const cacheKey = `customer-categories-${tree ? 'tree' : 'list'}`;
    return apiCache.getOrFetch(
        cacheKey,
        async () => {
            const url = tree ? '/customer/categories/tree' : '/customer/categories';
            const response = await api.get<CategoryListResponse>(url);
            return response.data;
        },
        5 * 1000 // 5 seconds cache TTL
    );
};
