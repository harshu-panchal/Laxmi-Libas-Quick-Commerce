import api from './config';

export interface INotification {
    _id: string;
    recipientType: "Admin" | "Seller" | "Customer" | "Delivery" | "All";
    recipientId?: string;
    title: string;
    message: string;
    type: "Info" | "Success" | "Warning" | "Error" | "Order" | "Payment" | "System";
    link?: string;
    actionLabel?: string;
    isRead: boolean;
    readAt?: string;
    priority: "Low" | "Medium" | "High" | "Urgent";
    createdAt: string;
    updatedAt: string;
}

export interface NotificationResponse {
    success: boolean;
    data: INotification[];
}

export interface GenericResponse {
    success: boolean;
    message: string;
}

/**
 * Get customer notifications
 */
export const getNotifications = async (): Promise<NotificationResponse> => {
    const response = await api.get<NotificationResponse>('/customer/notifications');
    return response.data;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (id: string): Promise<GenericResponse> => {
    const response = await api.put<GenericResponse>(`/customer/notifications/${id}/read`);
    return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<GenericResponse> => {
    const response = await api.put<GenericResponse>('/customer/notifications/mark-all-read');
    return response.data;
};
