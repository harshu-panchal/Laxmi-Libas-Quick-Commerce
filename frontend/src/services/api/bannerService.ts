
import api from './config';

export interface Banner {
    _id: string;
    imageUrl: string;
    title?: string;
    link?: string;
    order: number;
    isActive: boolean;
    pageLocation: string;
}

export const getAdminBanners = async () => {
    const response = await api.get('/banners');
    return response.data;
};

export const createBanner = async (data: Partial<Banner>) => {
    const response = await api.post('/banners', data);
    return response.data;
};

export const updateBanner = async (id: string, data: Partial<Banner>) => {
    const response = await api.put(`/banners/${id}`, data);
    return response.data;
};

export const deleteBanner = async (id: string) => {
    const response = await api.delete(`/banners/${id}`);
    return response.data;
};

export const getActiveBanners = async (location: string = 'Home Page') => {
    const response = await api.get(`/banners/active?location=${location}`);
    return response.data;
};
