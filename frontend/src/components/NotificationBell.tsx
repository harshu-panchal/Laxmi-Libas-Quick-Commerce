import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getNotifications } from '../services/api/customerNotificationService';
import { motion } from 'framer-motion';

export const NotificationBell = ({ size = 24, className = "" }: { size?: number, className?: string }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await getNotifications();
        if (res.success) {
          const count = res.data.filter((n: any) => !n.isRead).length;
          setUnreadCount(count);
        }
      } catch (err) {
        // Silent fail for notification count
      }
    };

    fetchCount();
    // Poll every 2 minutes
    const interval = setInterval(fetchCount, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <Bell size={size} />
      {unreadCount > 0 && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white"
        />
      )}
    </div>
  );
};
