import axiosInstance from '../config';

export interface HotelListing {
    _id: string;
    name: string;
    city: string;
    propertyType: string;
    status: string;
    sellerId: {
        _id: string;
        sellerName: string;
        storeName: string;
    };
    createdAt: string;
    policies?: {
        checkInTime?: string;
        checkOutTime?: string;
        coupleFriendly?: boolean;
        petsAllowed?: boolean;
        smokingAllowed?: boolean;
        localIdsAllowed?: boolean;
        alcoholAllowed?: boolean;
        forEvents?: boolean;
        outsideFoodAllowed?: boolean;
    };
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

export const getHotelStats = async () => {
    const response = await axiosInstance.get('/admin/hotels/stats');
    return response.data;
};

export const adminGetHotelRooms = async (params?: any) => {
    const response = await axiosInstance.get('/admin/hotels/rooms', { params });
    return response.data;
};

export const adminUpdateHotelRoom = async (id: string, data: { priceOverride?: number; isForcedClosed?: boolean; baseCapacity?: number; totalRooms?: number }) => {
    const response = await axiosInstance.put(`/admin/hotels/rooms/${id}`, data);
    return response.data;
};

export const getHotelPartners = async (params?: any) => {
    const response = await axiosInstance.get('/admin/hotels/partners', { params });
    return response.data;
};

export const updatePartnerVerification = async (id: string, verificationStatus: 'Verified' | 'Pending' | 'Rejected' | 'Suspended') => {
    const response = await axiosInstance.patch(`/admin/hotels/partners/${id}/verification`, { verificationStatus });
    return response.data;
};

export const adminProcessBookingAction = async (id: string, action: 'confirm' | 'cancel' | 'refund') => {
    const response = await axiosInstance.patch(`/admin/hotels/bookings/${id}/action`, { action });
    return response.data;
};

export const adminUpdateHotelPolicies = async (id: string, policies: any) => {
    const response = await axiosInstance.patch(`/admin/hotels/${id}/policies`, { policies });
    return response.data;
};

