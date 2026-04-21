import axiosInstance from '../config';

export interface BusListing {
    _id: string;
    busNumber: string;
    from: string;
    to: string;
    status: string;
    sellerId: {
        _id: string;
        sellerName: string;
        storeName: string;
    };
    createdAt: string;
}

export const getAllBuses = async (params?: any) => {
    const response = await axiosInstance.get('/admin/buses', { params });
    return response.data;
};

export const updateBusStatus = async (id: string, status: string) => {
    const response = await axiosInstance.patch(`/admin/buses/${id}/status`, { status });
    return response.data;
};

export const getBusBookings = async (params?: any) => {
    const response = await axiosInstance.get('/admin/buses/bookings', { params });
    return response.data;
};
