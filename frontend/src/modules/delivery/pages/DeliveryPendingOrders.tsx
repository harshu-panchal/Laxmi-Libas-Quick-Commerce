import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DeliveryHeader from '../components/DeliveryHeader';
import DeliveryBottomNav from '../components/DeliveryBottomNav';
import { getPendingOrders, getAvailableOrders, getDashboardStats } from '../../../services/api/delivery/deliveryService';
import { useDeliveryOrderNotifications } from '../../../hooks/useDeliveryOrderNotifications';
import { useDeliverySocket } from '../hooks/useDeliverySocket';

export default function DeliveryPendingOrders() {
  const navigate = useNavigate();
  const { acceptOrder } = useDeliveryOrderNotifications();
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<{ active: number; max: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Listen for real-time delivery notifications
  useDeliverySocket((notification) => {
    if (notification.type === 'NEW_ORDER' || notification.type === 'ORDER_ACCEPTED') {
      setRefreshTrigger(prev => prev + 1);
    }
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const [data, available, dash] = await Promise.all([
          getPendingOrders(),
          getAvailableOrders().catch(() => []),
          getDashboardStats().catch(() => null),
        ]);
        setPendingOrders(data || []);
        setAvailableOrders(available || []);
        if (dash && typeof dash.activeOrderCount === 'number') {
          setCapacity({
            active: dash.activeOrderCount,
            max: dash.maxConcurrentOrders ?? 3,
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load pending orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [refreshTrigger]);

  const handleAcceptAvailableOrder = async (orderId: string) => {
    if (acceptingId) return;
    setAcceptingId(orderId);
    try {
      const res = await acceptOrder(orderId);
      if (res.success) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (e) {
      console.error('Accept error:', e);
    } finally {
      setAcceptingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ready for pickup':
        return 'bg-yellow-100 text-yellow-700';
      case 'Out for delivery':
        return 'bg-blue-100 text-blue-700';
      case 'Pending':
        return 'bg-orange-100 text-orange-700';
      case 'Picked up':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center pb-20">
        <p className="text-neutral-500">Loading pending orders...</p>
        <DeliveryBottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center pb-20">
        <p className="text-red-500">{error}</p>
        <DeliveryBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 pb-20">
      {/* Header */}
      <DeliveryHeader />

      <div className="px-4 py-4">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className="mr-3 p-2 hover:bg-neutral-200 rounded-full transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h2 className="text-neutral-900 text-xl font-semibold">Today's Pending Orders</h2>
        </div>

        {capacity && (
          <p className="text-sm text-neutral-600 mb-4 -mt-2">
            Active deliveries: <span className="font-semibold text-teal-700">{capacity.active}</span> / {capacity.max}
          </p>
        )}

        {/* Available Orders Section */}
        {availableOrders.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-neutral-900 font-bold text-base">Available for Pickup</h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                {availableOrders.length} Available
              </span>
            </div>

            <div className="space-y-3">
              {availableOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="bg-emerald-50/50 rounded-2xl p-4 shadow-sm border border-emerald-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-neutral-900 font-bold text-sm">#{order.orderNumber}</p>
                      <p className="text-neutral-600 text-xs">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-700 font-bold text-sm">₹{order.deliveryBoyEarning} Earning</span>
                      {order.distanceKm && (
                        <p className="text-[11px] text-neutral-500">{order.distanceKm} km away</p>
                      )}
                    </div>
                  </div>

                  <p className="text-neutral-600 text-xs mb-3 line-clamp-1">
                    📍 {order.deliveryAddress?.address || ""}, {order.deliveryAddress?.city || ""}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-emerald-100">
                    <span className="text-xs text-neutral-500">Order Total: ₹{order.total}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptAvailableOrder(order.orderId);
                      }}
                      disabled={acceptingId === order.orderId}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
                    >
                      {acceptingId === order.orderId ? "Accepting..." : "Accept Order"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h3 className="text-neutral-900 font-bold text-base mb-3">Assigned Orders</h3>

        {pendingOrders.length > 0 ? (
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200 cursor-pointer"
                onClick={() => navigate(`/delivery/orders/${order.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-neutral-900 font-semibold text-sm mb-1">{order.orderId}</p>
                    <p className="text-neutral-600 text-xs mb-1">{order.customerName}</p>
                    <p className="text-neutral-500 text-xs">{order.customerPhone}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="border-t border-neutral-200 pt-3 mt-3">
                  <p className="text-neutral-600 text-xs mb-2 line-clamp-2">{order.address}</p>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-neutral-500 text-xs">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-neutral-900 font-bold">₹ {order.totalAmount}</p>
                  </div>
                  {order.estimatedDeliveryTime && (
                    <p className="text-neutral-500 text-xs">
                      ETA: {order.estimatedDeliveryTime} {order.distance && `• ${order.distance}`}
                    </p>
                  )}
                  <p className="text-neutral-400 text-xs mt-2">
                    {new Date(order.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 min-h-[400px] flex items-center justify-center shadow-sm border border-neutral-200">
            <p className="text-neutral-500 text-sm">No pending orders for today</p>
          </div>
        )}
      </div>
      <DeliveryBottomNav />
    </div>
  );
}

