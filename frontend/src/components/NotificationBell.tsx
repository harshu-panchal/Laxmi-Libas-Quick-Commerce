import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead, Notification } from '../services/api/customerNotificationService';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export const NotificationBell = ({ size = 24, className = "", variant = "dropdown" }: { size?: number, className?: string, variant?: "dropdown" | "static" }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { socket } = useSocket();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      if (res.success) {
        setNotifications(res.data);
        const count = res.data.filter((n: any) => !n.isRead).length;
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Socket listener for new notifications
    if (socket) {
      socket.on('notification', (newNotif: Notification) => {
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Play sound if supported
        try {
          const audio = new Audio('/assets/notification.mp3');
          audio.play().catch(() => {});
        } catch (e) {}
      });
    }

    return () => {
      if (socket) {
        socket.off('notification');
      }
    };
  }, [socket]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await markAsRead(id);
      if (res.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await markAllAsRead();
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'Success': return 'bg-green-100 text-green-600';
      case 'Error': return 'bg-red-100 text-red-600';
      case 'Warning': return 'bg-yellow-100 text-yellow-600';
      case 'Order': return 'bg-blue-100 text-blue-600';
      default: return 'bg-teal-100 text-teal-600';
    }
  };

  if (variant === "static") {
    return (
      <div className={`relative inline-flex ${className}`}>
        <Bell size={size} />
        {unreadCount > 0 && (
          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white text-[8px] font-bold rounded-full border border-white flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors focus:outline-none"
      >
        <Bell size={size} />
        {unreadCount > 0 && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-neutral-200 z-[100] overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <h3 className="font-bold text-neutral-900">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  <Check size={14} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-neutral-50">
                  {notifications.map((notif) => (
                    <div 
                      key={notif._id} 
                      className={`p-4 transition-colors hover:bg-neutral-50 relative group ${!notif.isRead ? 'bg-teal-50/30' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${getTypeStyles(notif.type)}`}>
                          <Bell size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className={`text-sm font-semibold truncate ${!notif.isRead ? 'text-neutral-900' : 'text-neutral-700'}`}>
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                              {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                            {notif.message}
                          </p>
                          {notif.link && (
                            <Link 
                              to={notif.link}
                              onClick={() => setIsOpen(false)}
                              className="text-[10px] font-bold text-teal-600 mt-2 flex items-center gap-1 hover:underline"
                            >
                              <ExternalLink size={10} /> View Details
                            </Link>
                          )}
                        </div>
                      </div>
                      {!notif.isRead && (
                        <button 
                          onClick={() => handleMarkAsRead(notif._id)}
                          className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-teal-100 rounded text-teal-600"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
                    <Bell size={24} />
                  </div>
                  <p className="text-sm text-neutral-500 font-medium">No notifications yet</p>
                  <p className="text-xs text-neutral-400 mt-1">We'll notify you when something important happens</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-100 text-center">
              <Link 
                to="/notifications" 
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
              >
                View All Notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
