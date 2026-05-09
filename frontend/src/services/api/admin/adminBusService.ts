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

export interface BusBookingListing {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
        mobile: string;
    };
    scheduleId: {
        _id: string;
        busId: {
            _id: string;
            busNumber: string;
            operatorName: string;
        };
        departureTime: string;
        departureDate: string;
    };
    seats: {
        seatNumber: string;
        passengerName: string;
        passengerAge: number;
        passengerGender: string;
    }[];
    totalAmount: number;
    pickupPoint: string;
    dropoffPoint: string;
    status: string;
    paymentStatus: string;
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

export const getBusStats = async () => {
    const response = await axiosInstance.get('/admin/buses/stats');
    return response.data;
};

export const getBusOperators = async (params?: any) => {
    const response = await axiosInstance.get('/admin/buses/operators', { params });
    return response.data;
};

export const updateOperatorStatus = async (id: string, status: 'Pending' | 'Approved' | 'Rejected' | 'Blocked') => {
    const response = await axiosInstance.patch(`/admin/buses/operators/${id}/status`, { status });
    return response.data;
};

export const adminGetBusRoutes = async (params?: any) => {
    const response = await axiosInstance.get('/admin/buses/routes', { params });
    return response.data;
};

export const adminAddBusRoute = async (data: any) => {
    const response = await axiosInstance.post('/admin/buses/routes', data);
    return response.data;
};

export const adminUpdateBusRoute = async (id: string, data: any) => {
    const response = await axiosInstance.put(`/admin/buses/routes/${id}`, data);
    return response.data;
};

export const adminDeleteBusRoute = async (id: string) => {
    const response = await axiosInstance.delete(`/admin/buses/routes/${id}`);
    return response.data;
};

export const adminGetBusSchedules = async (params?: any) => {
    const response = await axiosInstance.get('/admin/buses/schedules', { params });
    return response.data;
};

export const adminAddBusSchedule = async (data: any) => {
    const response = await axiosInstance.post('/admin/buses/schedules', data);
    return response.data;
};

export const adminUpdateBusSchedule = async (id: string, data: any) => {
    const response = await axiosInstance.put(`/admin/buses/schedules/${id}`, data);
    return response.data;
};

export const adminDeleteBusSchedule = async (id: string) => {
    const response = await axiosInstance.delete(`/admin/buses/schedules/${id}`);
    return response.data;
};

export const adminCancelTicket = async (id: string) => {
    const response = await axiosInstance.patch(`/admin/buses/bookings/${id}/cancel`);
    return response.data;
};
