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
