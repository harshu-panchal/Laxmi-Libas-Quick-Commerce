import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  MapPin, 
  Clock, 
  Phone, 
  MessageSquare, 
  CheckCircle, 
  Truck, 
  Box, 
  Package, 
  Share2, 
  ArrowRight,
  ShieldCheck,
  Navigation,
  Loader2
} from 'lucide-react';
import { getOrderTracking } from '../../services/api/trackingService';
import api from '../../services/api/config';
import Button from '../../components/ui/button';
import LiveTrackingMap from '../../components/LiveTrackingMap';
import { useDeliveryTracking } from '../../hooks/useDeliveryTracking';

import { useToast } from '../../context/ToastContext';

export default function TrackOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Support Escalation Drawer States
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [submittingSupport, setSubmittingSupport] = useState(false);
  const [supportCategory, setSupportCategory] = useState('Delivery Issue');
  const [supportPriority, setSupportPriority] = useState('Medium');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportDescription, setSupportDescription] = useState('');

  // Real-time tracking hook
  const { 
    deliveryLocation, 
    eta, 
    distance, 
    status: trackingStatus, 
    orderStatus, 
    deliveryOtp: socketOtp,
    isConnected,
    lastUpdate,
    trackingHistory
  } = useDeliveryTracking(id);

  useEffect(() => {
    if (!id) return;
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      const res = await getOrderTracking(id!);
      if (res.success) {
        setOrderData(res.data);
      } else {
        setError(res.message || 'Tracking information not available');
      }
    } catch (err) {
      setError('Failed to fetch tracking info');
    } finally {
      setLoading(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportDescription.trim()) {
      showToast('Subject and description are required', 'error');
      return;
    }

    setSubmittingSupport(true);
    try {
      const { createSupportTicket } = await import('../../services/api/supportService');
      const res = await createSupportTicket({
        category: supportCategory,
        priority: supportPriority as any,
        subject: supportSubject,
        description: supportDescription,
        orderId: id
      });

      if (res.success) {
        showToast('Escalation ticket filed. Support has been notified!', 'success');
        setShowSupportModal(false);
        setSupportSubject('');
        setSupportDescription('');
        fetchInitialData();
      } else {
        showToast(res.message || 'Failed to file escalation', 'error');
      }
    } catch (err) {
      showToast('Error registering support ticket', 'error');
    } finally {
      setSubmittingSupport(false);
    }
  };

  // Combine initial data with real-time updates
  const trackingData = orderData ? {
    ...orderData,
    status: orderStatus || orderData.status,
    trackingHistory: trackingHistory || orderData.trackingHistory,
    tracking: {
      ...orderData.tracking,
      currentLocation: deliveryLocation || orderData.tracking?.currentLocation,
      eta: eta !== 30 ? `${eta} mins` : orderData.tracking?.eta,
      distance: distance !== 0 ? `${(distance/1000).toFixed(1)} km` : orderData.tracking?.distance,
      status: trackingStatus !== 'idle' ? trackingStatus : orderData.tracking?.status,
    }
  } : null;

  const statusMap: Record<string, string> = {
    pending: "Order Placed",
    packed: "Order Packed",
    shipped: "Shipped",
    in_transit: "In Transit",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered"
  };

  const steps = [
    { key: "pending", label: "Order Placed", icon: "📝" },
    { key: "packed", label: "Order Packed", icon: "📦" },
    { key: "shipped", label: "Shipped", icon: "🚚" },
    { key: "in_transit", label: "In Transit", icon: "📍" },
    { key: "out_for_delivery", label: "Out for Delivery", icon: "🏠" },
    { key: "delivered", label: "Delivered", icon: "✅" }
  ];

  const getCurrentStepIndex = () => {
    if (!trackingData) return 0;
    // Normalize status to lowercase for mapping
    const currentStatus = trackingData.status?.toLowerCase().replace(/ /g, '_');
    const index = steps.findIndex(step => step.key === currentStatus);
    
    // Fallback logic for status matching
    if (index !== -1) return index;
    if (['delivered', 'completed'].includes(currentStatus)) return 5;
    if (['shipped', 'picked_up'].includes(currentStatus)) return 2;
    return 0;
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-neutral-600">Locating your order...</p>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
          <Truck size={36} className="text-neutral-200" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Tracking not available</h2>
        <p className="text-neutral-500 text-sm mb-8 max-w-[250px]">
          {error || "We're preparing your order for shipping. Tracking details will appear soon."}
        </p>
        <Button onClick={() => navigate(-1)} variant="outline" className="rounded-full px-8">
          Go Back
        </Button>
      </div>
    );
  }

  const isQuick = trackingData.orderType === 'quick';
  const trackingInfo = trackingData.tracking;
  const currentStep = getCurrentStepIndex();

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 pb-24">
      {/* 1. Sticky Header */}
      <div className="sticky top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-50 border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center hover:bg-neutral-200 transition-all active:scale-90"
          >
            <ChevronLeft size={24} className="text-neutral-900" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-neutral-900 tracking-tight">Track Order</h1>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">#{trackingData.orderNumber || id?.slice(-8)}</span>
          </div>
        </div>
        <button 
          onClick={() => setShowSupportModal(true)}
          className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-wider hover:bg-blue-100 transition-colors"
        >
           Help?
        </button>
      </div>

      {/* 2. Live HUD / Map Section */}
      <div className="relative">
        <div className="h-[35vh] w-full bg-neutral-900 relative overflow-hidden">
          {isQuick && trackingInfo?.currentLocation ? (
            <LiveTrackingMap 
              deliveryLocation={trackingInfo.currentLocation}
              customerLocation={{ 
                lat: trackingData.deliveryAddress?.latitude || 0, 
                lng: trackingData.deliveryAddress?.longitude || 0 
              }}
              isTracking={isConnected}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-8 text-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-2xl"
              >
                {trackingData.orderType === 'ecommerce' ? <Truck size={32} className="text-blue-400" /> : <Package size={32} className="text-blue-400" />}
              </motion.div>
              <h2 className="text-lg font-black text-white mb-1">
                {trackingData.orderType === 'ecommerce' ? 'Shipped via Courier' : 'Order Prepared'}
              </h2>
              <p className="text-neutral-400 text-xs max-w-[200px] leading-relaxed">
                {trackingData.orderType === 'ecommerce' ? `Awaiting courier pickup for ${trackingInfo?.trackingId || 'your package'}` : 'Delivery partner will be assigned shortly.'}
              </p>
            </div>
          )}
          
          {/* Real-time Status Overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
             <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="bg-white p-4 rounded-2xl shadow-2xl shadow-neutral-900/20 border border-neutral-100 flex items-center justify-between"
             >
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center relative">
                      <Truck className="text-blue-600" size={24} />
                      {isConnected && (
                         <span className="absolute -top-1 -right-1 flex h-3 w-3">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                         </span>
                      )}
                   </div>
                   <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Arriving In</span>
                        {isConnected && <span className="text-[8px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">Live</span>}
                      </div>
                      <span className="text-xl font-black text-neutral-900">{trackingInfo?.eta || 'Pending'}</span>
                   </div>
                </div>

                <div className="flex flex-col items-center">
                   <span className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Status</span>
                   <div className="flex items-center gap-1.5 mt-1">
                      <div className={`w-2 h-2 rounded-full ${
                        trackingData.status === 'Delivered' ? 'bg-emerald-500' :
                        trackingData.status === 'Out for Delivery' ? 'bg-amber-500' :
                        trackingData.status === 'Cancelled' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-xs font-black text-neutral-900">
                         {isQuick && isConnected ? '📍 Rider is on the way' : trackingData.status}
                      </span>
                   </div>
                </div>

                <div className="text-right flex flex-col">
                   <span className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Distance</span>
                   <span className="text-base font-black text-blue-600">{trackingInfo?.distance || '---'}</span>
                </div>
             </motion.div>
          </div>
        </div>
      </div>

      {/* Delivery OTP - HUD Highlight */}
      {!['Delivered', 'Cancelled', 'Returned'].includes(trackingData.status) && (trackingData.deliveryOtp || socketOtp) && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-4 -mt-2 mb-4 bg-white p-4 rounded-2xl border-2 border-blue-100 shadow-xl relative z-30"
        >
           <div className="flex items-center justify-between">
              <div className="flex flex-col">
                 <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Your Delivery Code</span>
                 <span className="text-3xl font-black tracking-[0.2em] text-neutral-900 mt-1">
                    {socketOtp || trackingData.deliveryOtp}
                 </span>
              </div>
              <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
                 <ShieldCheck className="text-blue-600" size={24} />
              </div>
           </div>
           <p className="text-[10px] text-neutral-400 font-bold mt-2 border-t border-neutral-50 pt-2">
              Please share this with the delivery partner to confirm receipt.
           </p>
        </motion.div>
      )}

      {/* 3. Progress Stepper */}
      <div className="bg-white px-6 py-8 border-b border-neutral-100">
        <div className="flex justify-between relative px-2">
          {/* Background Line */}
          <div className="absolute top-4.5 left-8 right-8 h-[2px] bg-neutral-100" />
          
          {/* Progress Line */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `calc(${(currentStep / (steps.length - 1)) * 100}% - 1rem)` }}
            className="absolute top-4.5 left-8 h-[2px] bg-blue-600 z-10" 
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {steps.map((step, index) => {
            const isActive = index <= currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div key={index} className="flex flex-col items-center gap-3 relative z-20">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 text-lg ${
                  isActive ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-200' : 'bg-white border-neutral-100'
                } ${isCurrent ? 'scale-125' : ''}`}>
                  {step.icon}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-tighter ${
                  isActive ? 'text-neutral-900' : 'text-neutral-300'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Current Status Highlight */}
      <div className="px-4 pt-6">
        <div className="bg-blue-600 rounded-2xl p-4 shadow-xl shadow-blue-200 flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Current Status</span>
              <h3 className="text-lg font-black text-white mt-1">
                 {statusMap[trackingData.status?.toLowerCase().replace(/ /g, '_')] || trackingData.status}
              </h3>
           </div>
           <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock className="text-white" size={20} />
           </div>
        </div>
      </div>

      {/* Smart Delivery Estimation Intelligence Section */}
      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Clock size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Smart Estimated Delivery</span>
              <span className="text-sm font-black text-neutral-900">
                {trackingData.estimatedDeliveryTime ? new Date(trackingData.estimatedDeliveryTime).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) : "Arriving Shortly"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">Estimated Time Window</span>
              <span className="font-bold text-neutral-700">
                {trackingData.estimatedDeliveryTime ? new Date(trackingData.estimatedDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "---"}
              </span>
            </div>
            <div className="text-right flex flex-col gap-0.5">
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">Reliability Score</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1 justify-end">
                <ShieldCheck size={12} /> High (99.4%)
              </span>
            </div>
          </div>

          {trackingData.isEscalated && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5 items-start mt-2">
              <span className="text-base">⚠️</span>
              <div className="flex flex-col">
                <span className="text-xs font-black text-amber-900 uppercase tracking-tight">Active Escalation Pending</span>
                <p className="text-[10px] text-amber-700 font-bold mt-0.5">
                  Our customer experience manager is actively resolving your delivery issue. Priority: {trackingData.escalationStatus || "High"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Order Details Card (Amazon Style) */}
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
           <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
              <span className="text-xs font-black text-neutral-900 uppercase tracking-widest">Order Summary</span>
              <span className="text-xs font-bold text-neutral-500">{new Date(trackingData.orderDate).toLocaleDateString()}</span>
           </div>
           <div className="p-4 flex gap-4">
              <div className="w-20 h-20 bg-neutral-100 rounded-xl overflow-hidden shrink-0 border border-neutral-200">
                 <img 
                   src={trackingData.items?.[0]?.productImage || 'https://via.placeholder.com/150'} 
                   className="w-full h-full object-cover" 
                   alt="Product"
                 />
              </div>
              <div className="flex flex-col justify-between py-1">
                 <div>
                    <h3 className="text-sm font-black text-neutral-900 line-clamp-1">{trackingData.items?.[0]?.productName || 'Order Items'}</h3>
                    <p className="text-[11px] text-neutral-500 font-bold mt-0.5">Qty: {trackingData.items?.length || 1} • {trackingData.paymentMethod}</p>
                 </div>
                 <div className="flex items-center justify-between w-full mt-2">
                    <span className="text-lg font-black text-neutral-900">₹{trackingData.total}</span>
                    <div className="flex items-center gap-1.5">
                       <ShieldCheck size={12} className="text-emerald-500" />
                       <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Payment Status: Paid</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* 5. Delivery Partner Info */}
        {isQuick && trackingInfo?.deliveryBoy && (
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-200 relative">
                <img 
                  src={trackingInfo.deliveryBoy.profileImage || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop'} 
                  alt={trackingInfo.deliveryBoy.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                 <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Your Delivery Partner</span>
                 <span className="text-base font-black text-neutral-900 leading-none mt-1">{trackingInfo.deliveryBoy.name}</span>
                 <div className="flex items-center gap-1 mt-1">
                   <div className="flex items-center gap-0.5 text-[10px] font-black text-amber-500">
                     ⭐ 4.9
                   </div>
                   <span className="text-[10px] text-neutral-300 font-bold">• 12k+ deliveries</span>
                 </div>
              </div>
            </div>
            <div className="flex gap-2">
               <a 
                 href={`tel:${trackingInfo.deliveryBoy.mobile || trackingInfo.deliveryBoy.phone}`}
                 className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-90"
               >
                  <Phone size={20} />
               </a>
            </div>
          </div>
        )}

        {/* 6. Shipping / Courier Info (Ecommerce Only) */}
        {!isQuick && (
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
             {!trackingInfo?.trackingId ? (
               <div className="flex flex-col items-center justify-center py-4 text-center">
                  <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center mb-3">
                    <Truck size={24} className="text-neutral-300" />
                  </div>
                  <p className="text-sm font-black text-neutral-900 uppercase tracking-widest">Tracking will be available soon</p>
                  <p className="text-[10px] text-neutral-400 font-bold mt-1 max-w-[200px]">Once the seller packs your order and hands it to the courier partner.</p>
               </div>
             ) : (
               <>
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                          <Truck size={18} />
                       </div>
                       <span className="text-xs font-black text-neutral-900 uppercase tracking-widest">Shipping Partner</span>
                    </div>
                    <span className="text-xs font-black text-blue-600 px-3 py-1 bg-blue-50 rounded-lg">{trackingInfo?.courierPartner || 'Delhivery'}</span>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Tracking Number</span>
                       <span className="text-sm font-mono font-black text-neutral-900 mt-1">{trackingInfo?.trackingId}</span>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(trackingInfo?.trackingId || '');
                        showToast('Tracking ID copied!', 'success');
                      }}
                      className="text-[10px] font-black uppercase text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg bg-white"
                    >
                      Copy
                    </button>
                 </div>
               </>
             )}
          </div>
        )}

        {/* 7. Detailed History (Vertically scrolling timeline) */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
           <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-neutral-100 text-neutral-900 rounded-lg flex items-center justify-center">
                 <Clock size={18} />
              </div>
              <span className="text-xs font-black text-neutral-900 uppercase tracking-widest">Detailed Tracking</span>
           </div>
           
           <div className="space-y-8 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-neutral-100">
              {/* If ecommerce, show full history from trackingHistory */}
              {!isQuick && trackingData.trackingHistory && trackingData.trackingHistory.length > 0 ? (
                trackingData.trackingHistory.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-5 relative group">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 transition-all ${
                      idx === 0 ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-200' : 'bg-white border-2 border-neutral-100 text-neutral-300'
                    }`}>
                        {idx === 0 ? <CheckCircle size={14} /> : <div className="w-2 h-2 rounded-full bg-neutral-200" />}
                    </div>
                    <div className="flex flex-col gap-1 pb-2">
                        <div className="flex items-baseline gap-2">
                           <span className={`text-sm font-black ${idx === 0 ? 'text-neutral-900' : 'text-neutral-500'}`}>
                              {item.status}
                           </span>
                           <span className="text-[10px] font-black text-neutral-300 uppercase">
                              {new Date(item.timestamp || item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                        {item.location && (
                           <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-400 italic">
                              <MapPin size={10} /> {item.location}
                           </div>
                        )}
                    </div>
                  </div>
                ))
              ) : (
                /* Fallback simple timeline */
                steps.slice(0, currentStep + 1).reverse().map((step, idx) => (
                  <div key={idx} className="flex gap-5 relative">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 ${
                       idx === 0 ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border-2 border-neutral-100 text-neutral-300'
                     }`}>
                         {idx === 0 ? <CheckCircle size={14} /> : <div className="w-2 h-2 rounded-full bg-neutral-200" />}
                     </div>
                     <div className="flex flex-col gap-0.5">
                        <span className={`text-sm font-black ${idx === 0 ? 'text-neutral-900' : 'text-neutral-400'}`}>{step.label}</span>
                        <span className="text-[10px] font-bold text-neutral-300">{idx === 0 ? 'Recently Updated' : 'Completed'}</span>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>

        {/* 8. Delivery Address Card */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                 <MapPin size={20} />
              </div>
              <div className="flex flex-col">
                 <span className="text-xs font-black text-neutral-900 uppercase tracking-widest">Delivery Address</span>
                 <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Home • Primary</span>
              </div>
           </div>
           <p className="text-sm text-neutral-600 font-bold leading-relaxed border-l-4 border-blue-100 pl-4 py-1 ml-3">
             {trackingData.deliveryAddress?.address}, {trackingData.deliveryAddress?.city} - {trackingData.deliveryAddress?.pincode}
           </p>
        </div>
      </div>

      {/* Safety & Support Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-neutral-100 z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
         <div className="flex gap-3 max-w-lg mx-auto">
            {['Received', 'Pending'].includes(trackingData.status) ? (
              <Button 
                variant="outline" 
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl py-4 h-auto font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                onClick={async () => {
                  const reason = window.prompt("Why are you cancelling this order?");
                  if (!reason) return;
                  try {
                    const response = await api.post(`/customer/orders/${id}/cancel`, { reason });
                    if (response.data?.success) {
                      showToast("Order cancelled and fully refunded to wallet!", "success");
                      fetchInitialData();
                    } else {
                      showToast(response.data?.message || "Failed to cancel order", "error");
                    }
                  } catch (err: any) {
                    showToast(err.response?.data?.message || "Error cancelling order", "error");
                  }
                }}
              >
                 Cancel Order
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl py-4 h-auto font-black text-xs uppercase tracking-widest border-neutral-200 flex items-center justify-center gap-2"
                onClick={() => setShowSupportModal(true)}
              >
                 <MessageSquare size={16} /> Support
              </Button>
            )}
            
            <Button 
              variant="default" 
              className="flex-[2] bg-neutral-900 text-white rounded-xl py-4 h-auto font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
              onClick={() => setShowSupportModal(true)}
            >
               File Escalation <ArrowRight size={16} />
            </Button>
         </div>
      </div>

      {/* 9. Support Ticket Escalation Drawer Modal */}
      <AnimatePresence>
        {showSupportModal && (
          <>
            {/* Glassmorphic Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-neutral-950 z-50 backdrop-blur-sm"
              onClick={() => setShowSupportModal(false)}
            />

            {/* Bottom/Right Sliding Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white rounded-t-[32px] shadow-2xl z-50 border-t border-neutral-100 p-6 pb-8 overflow-y-auto max-h-[85vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Support Center</span>
                  <h2 className="text-xl font-black text-neutral-900 mt-1">Order Escalation</h2>
                </div>
                <button 
                  onClick={() => setShowSupportModal(false)}
                  className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center hover:bg-neutral-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSupportSubmit} className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Issue Category</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      { key: 'Delivery Issue', label: '🚚 Delivery delay' },
                      { key: 'Missing Item', label: '📦 Missing product' },
                      { key: 'Incorrect Item', label: '❌ Incorrect item' },
                      { key: 'Payment & Refund', label: '💳 Payment/Refund' },
                    ].map((cat) => (
                      <button
                        type="button"
                        key={cat.key}
                        onClick={() => setSupportCategory(cat.key)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 ${
                          supportCategory === cat.key 
                            ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' 
                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Priority Level</label>
                  <div className="flex gap-2 mt-2">
                    {['Low', 'Medium', 'High'].map((pri) => (
                      <button
                        type="button"
                        key={pri}
                        onClick={() => setSupportPriority(pri)}
                        className={`flex-1 p-2.5 rounded-lg border text-xs font-bold transition-all ${
                          supportPriority === pri 
                            ? pri === 'High' 
                              ? 'bg-red-50 border-red-500 text-red-700' 
                              : pri === 'Medium'
                                ? 'bg-amber-50 border-amber-500 text-amber-700'
                                : 'bg-emerald-50 border-emerald-500 text-emerald-700'
                            : 'bg-white border-neutral-200 text-neutral-600'
                        }`}
                      >
                        {pri}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief summary of your issue"
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    className="w-full mt-1.5 p-3.5 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-900 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Detailed Description</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide details to help our team solve your problem faster..."
                    value={supportDescription}
                    onChange={(e) => setSupportDescription(e.target.value)}
                    className="w-full mt-1.5 p-3.5 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-900 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submittingSupport}
                  className="w-full bg-blue-600 text-white font-black uppercase text-xs tracking-widest py-4 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-neutral-200"
                >
                  {submittingSupport ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Submitting Escalation...
                    </>
                  ) : (
                    <>
                      Submit Escalation Ticket
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
