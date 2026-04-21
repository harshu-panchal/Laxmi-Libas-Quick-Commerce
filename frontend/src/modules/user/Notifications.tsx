import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, ChevronLeft, ShoppingBag, CreditCard, Info, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead, Notification } from '../../services/api/customerNotificationService';
import Button from '../../components/ui/button';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getNotifications();
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string, link?: string) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      if (link) {
        navigate(link);
      }
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Order': return <ShoppingBag size={18} className="text-blue-500" />;
      case 'Payment': return <CreditCard size={18} className="text-emerald-500" />;
      case 'Success': return <CheckCircle size={18} className="text-emerald-500" />;
      case 'Error': return <AlertTriangle size={18} className="text-red-500" />;
      case 'Warning': return <AlertTriangle size={18} className="text-amber-500" />;
      default: return <Info size={18} className="text-blue-500" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-100 pb-20">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 px-4 py-4 flex items-center justify-between border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-neutral-600">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-neutral-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              {unreadCount}
            </span>
          )}
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-neutral-100 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-100 rounded w-1/3" />
                    <div className="h-3 bg-neutral-50 rounded w-full" />
                    <div className="h-2 bg-neutral-50 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ) )}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Bell size={36} className="text-neutral-200" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">No notifications yet</h2>
            <p className="text-neutral-500 text-sm max-w-[250px]">
              Check back here for updates on your orders and special offers.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            <AnimatePresence>
              {notifications.map((notification) => (
                <motion.div
                  key={notification._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative group bg-white rounded-xl p-4 transition-all ${
                    !notification.isRead ? 'border-l-4 border-blue-600' : 'opacity-80'
                  }`}
                  onClick={() => handleMarkRead(notification._id, notification.link)}
                >
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      !notification.isRead ? 'bg-blue-50' : 'bg-neutral-50'
                    }`}>
                      {getIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h3 className={`text-sm tracking-tight line-clamp-1 ${
                          !notification.isRead ? 'font-bold text-neutral-900' : 'font-medium text-neutral-600'
                        }`}>
                          {notification.title}
                        </h3>
                        <span className="text-[10px] text-neutral-400 font-medium shrink-0 ml-2">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className={`text-xs pr-4 line-clamp-2 leading-relaxed ${
                        !notification.isRead ? 'text-neutral-700 font-medium' : 'text-neutral-500'
                      }`}>
                        {notification.message}
                      </p>
                    </div>

                    {!notification.isRead && (
                      <div className="absolute top-1/2 -translate-y-1/2 right-4 w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
