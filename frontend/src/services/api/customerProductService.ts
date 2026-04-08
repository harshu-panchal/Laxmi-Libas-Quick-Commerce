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
    data: Product & { similarProducts?: Product[] };
}

export interface CategoryListResponse {
    success: boolean;
    data: Category[];
}

/**
 * Get products with filters (Public)
 * Location (latitude/longitude) is required to filter products by seller's service radius
 */
export const getProducts = async (params?: GetProductsParams): Promise<ProductListResponse> => {
    /*
    // Handle mock Men's Wear category - Disabled for live flow testing
    if (params?.category === 'mens-wear') {
        const { CLOTHING_MOCK_DATA } = await import('../../utils/clothingMockData');
        return {
            success: true,
            data: CLOTHING_MOCK_DATA.products as any,
            pagination: { page: 1, limit: 10, total: CLOTHING_MOCK_DATA.products.length, pages: 1 }
        };
    }
    */
    const response = await api.get<ProductListResponse>('/customer/products', { params });
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // Global filter to hide mock/placeholder products (jeans 50/200 or truck icon)
        const isMockProduct = (p: any) => 
            ((p.name?.toLowerCase() === 'jeans' || (p.productName || p.title || "").toLowerCase() === 'jeans') && 
             (Number(p.price) === 200 || Number(p.price) === 50 || Number(p.originalPrice) === 200)) ||
            ((p.imageUrl || "").includes('10mins_icon_pink') || (p.mainImage || "").includes('10mins_icon_pink') || 
             (p.imageUrl || "").includes('truck') || (p.mainImage || "").includes('truck'));

        response.data.data = response.data.data.filter(p => !isMockProduct(p));
    }
    
    return response.data;
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
        const isMockProduct = (p: any) => 
            ((p.name?.toLowerCase() === 'jeans' || (p.productName || p.title || "").toLowerCase() === 'jeans') && 
             (Number(p.price) === 200 || Number(p.price) === 50 || Number((p as any).originalPrice) === 200)) ||
            ((p.imageUrl || "").includes('10mins_icon_pink') || (p.mainImage || "").includes('10mins_icon_pink') || 
             (p.imageUrl || "").includes('truck') || (p.mainImage || "").includes('truck'));

        response.data.data.similarProducts = response.data.data.similarProducts.filter(p => !isMockProduct(p));
    }
    
    return response.data;
};

/**
 * Get category details by ID or slug (Public)
 */
export const getCategoryById = async (id: string): Promise<any> => {
    const response = await api.get<any>(`/customer/categories/${id}`);
    return response.data;
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
        10 * 60 * 1000 // 10 minutes cache
    );
};
