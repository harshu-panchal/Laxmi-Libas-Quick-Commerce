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
  Navigation
} from 'lucide-react';
import { getOrderTracking } from '../../services/api/trackingService'; // Need to create this
import Button from '../../components/ui/button';
import LiveTrackingMap from '../../components/LiveTrackingMap'; // Use existing map component

export default function TrackOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchTracking();
    const interval = setInterval(fetchTracking, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [id]);

  const fetchTracking = async () => {
    try {
      const res = await getOrderTracking(id!);
      if (res.success) {
        setTrackingData(res.data);
      } else {
        setError(res.message || 'Tracking information not available');
      }
    } catch (err) {
      setError('Failed to fetch tracking info');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: 'Confirmed', status: ['Received', 'Accepted', 'Pending', 'Processed'], icon: <CheckCircle size={18} /> },
    { label: 'Packed', status: ['Packed', 'Ready for pickup'], icon: <Box size={18} /> },
    { label: 'On the Way', status: ['Shipped', 'Picked up', 'In Transit', 'On the way', 'Out for Delivery'], icon: <Truck size={18} /> },
    { label: 'Delivered', status: ['Delivered'], icon: <Package size={18} /> }
  ];

  const getCurrentStepIndex = () => {
    if (!trackingData) return 0;
    const currentStatus = trackingData.status;
    const index = steps.findIndex(step => step.status.includes(currentStatus));
    return index === -1 ? (['Delivered'].includes(currentStatus) ? 3 : 0) : index;
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
    <div className="flex flex-col min-h-screen bg-neutral-100 pb-20">
      {/* 1. Map / Header Overlay */}
      <div className="h-[40vh] relative bg-neutral-900 overflow-hidden">
        {isQuick && trackingInfo?.currentLocation ? (
          <LiveTrackingMap 
            currentLocation={trackingInfo.currentLocation}
            deliveryAddress={trackingData.deliveryAddress}
            route={trackingInfo.route}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-950 p-6 text-center">
            <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4"
            >
               <Package size={40} className="text-white" />
            </motion.div>
            <h1 className="text-xl font-bold text-white mb-2">
              {trackingData.orderType === 'ecommerce' ? 'Shipped via Courier' : 'Preparing Order'}
            </h1>
            <p className="text-white/60 text-sm max-w-[200px]">
              {trackingData.orderType === 'ecommerce' ? `Tracking ID: ${trackingInfo?.trackingId || 'N/A'}` : 'Assigning delivery partner...'}
            </p>
          </div>
        )}
        
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 pointer-events-none">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg pointer-events-auto">
            <ChevronLeft size={24} className="text-neutral-900" />
          </button>
          <div className="flex gap-3">
             <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg pointer-events-auto">
               <Share2 size={20} className="text-neutral-900" />
             </button>
          </div>
        </div>

        {/* Status Bubble */}
        <div className="absolute bottom-6 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl z-20 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                 <Truck className="text-blue-600" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Status Update</span>
                 <span className="text-base font-black text-neutral-900">{trackingData.status}</span>
              </div>
           </div>
           {trackingInfo?.eta && (
             <div className="text-right flex flex-col">
                <span className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Arriving In</span>
                <span className="text-xl font-black text-blue-600">{trackingInfo.eta}</span>
             </div>
           )}
        </div>
      </div>

      {/* 2. Tracking Steps */}
      <div className="bg-white px-6 py-8 mb-2">
        <div className="flex justify-between relative">
          {/* Progress Bar Line */}
          <div className="absolute top-4 left-4 right-4 h-1 bg-neutral-100 -z-1" />
          <div 
            className="absolute top-4 left-4 h-1 bg-blue-600 transition-all duration-1000 ease-out -z-1" 
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center gap-2 relative z-10">
               <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                 index <= currentStep ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-neutral-100 text-neutral-300'
               }`}>
                  {index < currentStep ? <CheckCircle size={20} /> : step.icon}
               </div>
               <span className={`text-[11px] font-bold tracking-tight text-center ${
                 index <= currentStep ? 'text-neutral-900' : 'text-neutral-400'
               }`}>
                  {step.label}
               </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Delivery Details */}
      <div className="space-y-2">
        {/* Delivery Partner (Only for Quick) */}
        {isQuick && trackingInfo?.deliveryBoy && (
          <div className="bg-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-neutral-100 rounded-full overflow-hidden border-2 border-white shadow-md">
                <img 
                  src={trackingInfo.deliveryBoy.profileImage || 'https://via.placeholder.com/150'} 
                  alt={trackingInfo.deliveryBoy.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                 <span className="text-sm font-black text-neutral-900">{trackingInfo.deliveryBoy.name}</span>
                 <div className="flex items-center gap-2">
                   <div className="flex items-center bg-blue-50 px-2 py-0.5 rounded text-[10px] font-bold text-blue-600">
                     ⭐ 4.9
                   </div>
                   <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest">Laxmart Partner</span>
                 </div>
              </div>
            </div>
            <div className="flex gap-2">
               <button className="w-11 h-11 bg-neutral-100 text-neutral-900 rounded-full flex items-center justify-center hover:bg-neutral-200 transition-colors">
                  <MessageSquare size={20} />
               </button>
               <a 
                 href={`tel:${trackingInfo.deliveryBoy.phone}`}
                 className="w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-all shadow-md active:scale-95"
               >
                  <Phone size={20} />
               </a>
            </div>
          </div>
        )}

        {/* Address */}
        <div className="bg-white p-5">
           <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                 <MapPin size={18} />
              </div>
              <span className="text-sm font-black text-neutral-900 uppercase tracking-widest">Delivery Address</span>
           </div>
           <p className="text-sm text-neutral-600 font-medium leading-relaxed pl-10 border-l-2 border-neutral-50 ml-4 pb-2">
             {trackingData.deliveryAddress?.address}, {trackingData.deliveryAddress?.city}
           </p>
        </div>

        {/* Courier Details (Only for Ecommerce) */}
        {!isQuick && (
          <div className="bg-white p-5 border-t border-neutral-100">
             <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                   <Truck size={18} />
                </div>
                <span className="text-sm font-black text-neutral-900 uppercase tracking-widest">Shipping Details</span>
             </div>
             
             <div className="pl-10 space-y-4">
                <div className="flex flex-col gap-0.5">
                   <span className="text-[10px] font-black text-neutral-300 uppercase letter-spacing-wider">Courier Partner</span>
                   <span className="text-sm font-bold text-neutral-700">{trackingInfo?.courierPartner || 'LaxMart Logistics'}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                   <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-black text-neutral-300 uppercase letter-spacing-wider">Tracking ID</span>
                      <span className="text-sm font-mono font-bold text-blue-600">{trackingInfo?.trackingId || 'N/A'}</span>
                   </div>
                   <button className="text-[10px] font-black uppercase text-blue-600 px-3 py-1.5 bg-blue-50 rounded-lg">Copy</button>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Safety Section */}
      <div className="mt-4 px-6 py-6 pb-20 bg-neutral-50 border-t border-neutral-100">
         <div className="flex gap-4 items-start">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
               <ShieldCheck size={24} />
            </div>
            <div className="flex flex-col gap-1">
               <h4 className="text-sm font-black text-neutral-900">Safety Guaranteed</h4>
               <p className="text-[11px] text-neutral-500 font-medium leading-normal">
                 Our delivery partners follow strict hygiene protocols. Your order is safe and professionally handled.
               </p>
            </div>
         </div>
      </div>

      {/* Footer Support */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-neutral-100 z-30">
         <Button 
           variant="default" 
           className="w-full bg-neutral-900 text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 h-auto"
         >
           Need help with this order? <ArrowRight size={18} />
         </Button>
      </div>
    </div>
  );
}
