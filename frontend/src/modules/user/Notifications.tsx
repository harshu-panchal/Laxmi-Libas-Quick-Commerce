import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    ArrowLeft,
    CheckCheck,
    Info,
    Package,
    CreditCard,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Settings
} from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead, INotification } from '../../services/api/customerNotificationService';
import AppLayout from '../../components/AppLayout';

export default function Notifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await getNotifications();
            if (response.success) {
                setNotifications(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            const response = await markAsRead(id);
            if (response.success) {
                setNotifications(prev =>
                    prev.map(n => n._id === id ? { ...n, isRead: true } : n)
                );
            }
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const response = await markAllAsRead();
            if (response.success) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const getIcon = (type: string, isRead: boolean) => {
        const size = 20;
        const color = isRead ? "text-neutral-400" : "text-brand-600";

        switch (type) {
            case 'Order':
                return <Package size={size} className={isRead ? "text-neutral-400" : "text-blue-600"} />;
            case 'Payment':
                return <CreditCard size={size} className={isRead ? "text-neutral-400" : "text-green-600"} />;
            case 'Success':
                return <CheckCircle2 size={size} className={isRead ? "text-neutral-400" : "text-green-600"} />;
            case 'Error':
                return <XCircle size={size} className={isRead ? "text-neutral-400" : "text-red-600"} />;
            case 'Warning':
                return <AlertTriangle size={size} className={isRead ? "text-neutral-400" : "text-orange-600"} />;
            case 'System':
                return <Settings size={size} className={isRead ? "text-neutral-400" : "text-purple-600"} />;
            default:
                return <Info size={size} className={color} />;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-neutral-800" />
                    </button>
                    <h1 className="text-xl font-bold text-neutral-900">Notifications</h1>
                </div>
                {notifications.some(n => !n.isRead) && (
                    <button
                        onClick={handleMarkAllRead}
                        className="text-brand-600 text-sm font-semibold flex items-center gap-1 hover:text-brand-700"
                    >
                        <CheckCheck size={16} />
                        Mark all read
                    </button>
                )}
            </header>

            <main className="max-w-2xl mx-auto p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                        <p className="text-neutral-500 font-medium tracking-tight">Fetching updates...</p>
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <div
                                key={notification._id}
                                onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                                className={`group relative bg-white rounded-2xl p-4 shadow-sm border transition-all duration-300 hover:shadow-md cursor-pointer ${notification.isRead
                                        ? 'border-neutral-100 opacity-80'
                                        : 'border-brand-100 bg-brand-50/30'
                                    }`}
                            >
                                <div className="flex gap-4">
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${notification.isRead ? 'bg-neutral-50' : 'bg-brand-50'
                                        }`}>
                                        {getIcon(notification.type, notification.isRead)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`text-sm font-bold truncate pr-6 ${notification.isRead ? 'text-neutral-700' : 'text-neutral-900'
                                                }`}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-[10px] font-medium text-neutral-400 whitespace-nowrap">
                                                {formatTime(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className={`text-xs leading-relaxed line-clamp-2 ${notification.isRead ? 'text-neutral-500' : 'text-neutral-600'
                                            }`}>
                                            {notification.message}
                                        </p>

                                        {notification.link && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(notification.link!);
                                                }}
                                                className="mt-3 text-brand-600 text-xs font-bold hover:underline"
                                            >
                                                {notification.actionLabel || 'View Details'} →
                                            </button>
                                        )}
                                    </div>
                                    {!notification.isRead && (
                                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand-600 animate-pulse"></div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
                            <Bell size={40} className="text-neutral-400" />
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900 mb-2">No notifications yet</h2>
                        <p className="text-neutral-500 max-w-xs mx-auto text-sm leading-relaxed">
                            Treat yourself to something special! We'll notify you here when your order is on the way.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-8 bg-neutral-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-200"
                        >
                            Start Shopping
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
