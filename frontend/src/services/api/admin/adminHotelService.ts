import axiosInstance from '../config';

export interface HotelListing {
    _id: string;
    title: string;
    city: string;
    rentAmount: number;
    status: string;
    seller: {
        _id: string;
        sellerName: string;
        storeName: string;
    };
    createdAt: string;
}

export const getAllHotels = async (params?: any) => {
    const response = await axiosInstance.get('/admin/hotels', { params });
    return response.data;
};

export const updateHotelStatus = async (id: string, status: string) => {
    const response = await axiosInstance.patch(`/admin/hotels/${id}/status`, { status });
    return response.data;
};

export const getHotelBookings = async (params?: any) => {
    const response = await axiosInstance.get('/admin/hotels/bookings', { params });
    return response.data;
};
