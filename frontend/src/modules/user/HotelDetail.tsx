import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Star, Share2, MapPin, ChevronRight, Check, Info, ShieldCheck, Clock, Ban, Cigarette, Dog, Map as MapIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useShare } from '../../hooks/useShare';
import ShareSheet from '../../components/ShareSheet';
import { getHotelDetails } from '../../services/api/customerHotelService';

const HotelDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [hotel, setHotel] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const response = await getHotelDetails(id);
                if (response.success) {
                    setHotel(response.data.hotel);
                }
            } catch (error) {
                console.error('Failed to fetch hotel details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    // Sharing hook
    const { 
        share, 
        isShareSheetOpen, 
        shareData, 
        closeShareSheet, 
        copyToClipboard 
    } = useShare();

    const handleShare = () => {
        if (!hotel) return;
        share({
            title: hotel.name,
            text: `Looking at this amazing property: ${hotel.name} in ${hotel.city || hotel.location}`,
            url: window.location.href,
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-sm font-bold text-gray-500">Loading property details...</p>
            </div>
        );
    }

    if (!hotel) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-black text-gray-900 mb-2">Hotel Not Found</h1>
                <p className="text-sm font-bold text-gray-500 mb-8">The property you're looking for doesn't exist or has been removed.</p>
                <button 
                    onClick={() => navigate('/store/travel/hotels/list')}
                    className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest"
                >
                    Back to Hotel List
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-24 font-['Inter']">
            {/* Hero Image Section */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                <img 
                    src={hotel.mainImage || (hotel.images && hotel.images[0]) || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'} 
                    alt={hotel.name} 
                    className="w-full h-full object-cover"
                />
                
                {/* Header Controls */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    >
                        <ArrowLeft size={20} className="text-gray-900" />
                    </button>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleShare}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                        >
                            <Share2 size={20} className="text-gray-900" />
                        </button>
                    </div>
                </div>

                {/* Image Count Badge */}
                <div className="absolute bottom-16 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-lg border border-white/20 uppercase tracking-widest">
                    + {hotel.images?.length || 0} photos
                </div>

                {/* Progress Dots */}
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5">
                    <div className="h-1.5 w-6 bg-white rounded-full"></div>
                    <div className="h-1.5 w-1.5 bg-white/50 rounded-full"></div>
                    <div className="h-1.5 w-1.5 bg-white/50 rounded-full"></div>
                </div>
            </div>

            {/* Floating Info Card */}
            <div className="px-5 -mt-12 relative z-20">
                <div className="bg-white rounded-[32px] p-6 shadow-[0_15px_50px_rgba(0,0,0,0.1)] border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-blue-600 text-white text-[11px] font-black px-2 py-0.5 rounded shadow-sm">
                            {hotel.rating || 4.2}
                        </div>
                        <span className="text-blue-600 font-[900] text-sm uppercase tracking-tight">
                            {hotel.rating >= 4.5 ? 'Excellent' : 'Very Good'} · {hotel.reviewsCount || 0} reviews
                        </span>
                    </div>

                    <h1 className="text-2xl font-[1000] text-gray-900 leading-tight mb-2">
                        {hotel.name}
                    </h1>

                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star 
                                    key={i} 
                                    size={14} 
                                    fill={i < hotel.stars ? "#ffc107" : "none"} 
                                    className={i < hotel.stars ? "text-[#ffc107]" : "text-gray-300"} 
                                />
                            ))}
                        </div>
                        <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            {hotel.propertyType} in {hotel.city}
                        </span>
                    </div>
                </div>
            </div>

            {/* Highlights Section */}
            <div className="px-5 mt-8 grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 rounded-[24px] p-4 border border-gray-100 flex flex-col items-center text-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 text-center">Location</span>
                    <div className="relative mb-2">
                        <span className="text-sm font-black text-gray-900 leading-tight">{hotel.city}</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{hotel.state}</span>
                </div>

                <div className="bg-cyan-50/30 rounded-[24px] p-4 border border-cyan-100/50 flex flex-col items-center">
                    <span className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.2em] mb-3">Key Feature</span>
                    <div className="flex flex-wrap justify-center gap-1.5">
                        <span className="text-[11px] font-black text-cyan-700 tracking-tight">{hotel.propertyType}</span>
                        <span className="text-cyan-300 text-[8px] self-center">✦</span>
                        <span className="text-[11px] font-black text-cyan-700 tracking-tight">{hotel.spaceType || 'Private Room'}</span>
                    </div>
                </div>
            </div>

            {/* About This Property */}
            <div className="px-5 mt-10">
                <div className="flex items-center gap-2 mb-4">
                    <Info size={18} className="text-blue-600" />
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-wider">About This Property</h3>
                </div>
                <div className="space-y-4">
                    <p className="text-sm font-bold text-gray-600 leading-relaxed">
                        {hotel.description || "No description provided."}
                    </p>
                </div>
            </div>

            {/* Rules & Policies */}
            <div className="px-5 mt-12">
                <div className="flex items-center gap-2 mb-6">
                    <ShieldCheck size={18} className="text-blue-600" />
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-wider">Rules & Policies</h3>
                </div>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                                <Clock size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Check-in</p>
                                <p className="text-sm font-black text-gray-900">{hotel.policies?.checkInTime || '12:00 PM'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                                <Clock size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Check-out</p>
                                <p className="text-sm font-black text-gray-900">{hotel.policies?.checkOutTime || '11:00 AM'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <Cigarette size={18} className={hotel.policies?.smokingAllowed ? "text-blue-600" : "text-gray-400"} />
                                <span className="text-xs font-black text-gray-700">Smoking Allowed</span>
                            </div>
                            {hotel.policies?.smokingAllowed ? (
                                <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded uppercase">Yes</span>
                            ) : (
                                <Ban size={16} className="text-red-400" />
                            )}
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <Dog size={18} className={hotel.policies?.petsAllowed ? "text-blue-600" : "text-gray-400"} />
                                <span className="text-xs font-black text-gray-700">Pets Allowed</span>
                            </div>
                            {hotel.policies?.petsAllowed ? (
                                <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded uppercase">Yes</span>
                            ) : (
                                <Ban size={16} className="text-red-400" />
                            )}
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={18} className={hotel.policies?.coupleFriendly ? "text-blue-600" : "text-gray-400"} />
                                <span className="text-xs font-black text-gray-700">Couple Friendly</span>
                            </div>
                            {hotel.policies?.coupleFriendly ? (
                                <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded uppercase">Yes</span>
                            ) : (
                                <Ban size={16} className="text-red-400" />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Exact Location */}
            <div className="px-5 mt-12 mb-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <MapIcon size={18} className="text-blue-600" />
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-wider">Exact Location</h3>
                    </div>
                </div>
                
                <div className="relative group overflow-hidden rounded-[28px] border border-gray-100 shadow-sm">
                    {/* Map Placeholder */}
                    <div className="aspect-[16/9] bg-blue-50 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl animate-bounce">
                                <MapPin size={24} fill="white" />
                            </div>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Interactive Map</span>
                        </div>
                        {/* Static Pattern */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2563eb 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }}></div>
                    </div>
                    
                    <div className="p-4 bg-white border-t border-gray-100">
                        <p className="text-sm font-bold text-gray-800 leading-tight">
                            {hotel.address}, {hotel.city} {hotel.pincode}
                        </p>
                    </div>
                </div>
            </div>

            <div className="h-20"></div> {/* Spacer for sticky footer */}

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-50">
                <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-[1000] text-gray-900 leading-tight">₹{(hotel.basePrice || 0).toLocaleString()}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                            / NIGHT
                        </span>
                    </div>
                </div>
                
                <button 
                    onClick={() => navigate(`/store/travel/hotels/rooms/${id}`)}
                    className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-xl font-[1000] text-[11px] uppercase tracking-[0.1em] shadow-lg shadow-yellow-100 active:scale-95 transition-all whitespace-nowrap"
                >
                    Select Room
                </button>
            </div>
            <ShareSheet
                isOpen={isShareSheetOpen}
                onClose={closeShareSheet}
                shareData={shareData}
                onCopyPath={copyToClipboard}
            />
        </div>
    );
};

export default HotelDetail;
