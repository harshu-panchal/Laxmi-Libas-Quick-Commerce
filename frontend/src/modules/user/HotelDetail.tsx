import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Star, Share2, MapPin, ChevronRight, Check, Info, ShieldCheck, Clock, Ban, Cigarette, Dog, Map as MapIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useShare } from '../../hooks/useShare';
import ShareSheet from '../../components/ShareSheet';
import { getHotelDetails } from '../../services/api/customerHotelService';

const getAmenityIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('wifi') || n.includes('internet')) return '📶';
    if (n.includes('pool') || n.includes('swimming')) return '🏊';
    if (n.includes('ac') || n.includes('air cond') || n.includes('cooling') || n.includes('condition')) return '❄️';
    if (n.includes('tv') || n.includes('television')) return '📺';
    if (n.includes('park') || n.includes('parking')) return '🅿️';
    if (n.includes('gym') || n.includes('fitness')) return '🏋️';
    if (n.includes('spa') || n.includes('massage')) return '💆';
    if (n.includes('food') || n.includes('restaurant') || n.includes('breakfast') || n.includes('dining')) return '🍳';
    if (n.includes('bar') || n.includes('drink') || n.includes('lounge')) return '🍺';
    if (n.includes('geyser') || n.includes('hot water')) return '🔥';
    return '✦';
};

const HotelDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [hotel, setHotel] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState<'AMENITIES' | 'POLICIES' | 'RATINGS'>('AMENITIES');

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

    const amenities = hotel.amenities || hotel.facilities || hotel.businessDetails?.amenities || ['Free Wifi', 'Air Conditioning', 'Flat TV', 'Hot Water', 'Room Service', '24x7 Security'];

    const reviewsList = hotel.reviews || [
        { name: "Rahul Sharma", date: "April 2026", score: 5, text: "Extremely clean rooms, exceptionally polite staff, and the location is perfect for travelers. Highly recommended!" },
        { name: "Anjali Gupta", date: "May 2026", score: 4.8, text: "Excellent service. Check-in was an absolute breeze. Couple friendly rules make it safe and secure." },
        { name: "David Miller", date: "May 2026", score: 4.5, text: "Great value for money. Loved the quick room service and high speed wifi. Will stay again." }
    ];

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

            {/* Custom Tab Switcher */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 border-b border-gray-100 mt-10">
                <div className="flex px-5">
                    {[
                        { id: 'AMENITIES', label: 'Amenities' },
                        { id: 'POLICIES', label: 'Policies' },
                        { id: 'RATINGS', label: 'Ratings' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className="flex-1 py-4 text-center relative font-[900] text-xs uppercase tracking-widest transition-colors duration-300"
                            style={{ color: activeTab === tab.id ? '#2563eb' : '#9ca3af' }}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div 
                                    layoutId="activeTabIndicator"
                                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-full"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Contents */}
            <div className="px-5 mt-8">
                {activeTab === 'AMENITIES' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 gap-4"
                    >
                        {amenities.map((amenity: string, i: number) => (
                            <div 
                                key={i} 
                                className="flex items-center gap-3 p-4 bg-neutral-50/75 border border-neutral-100 rounded-[20px] transition-all hover:bg-neutral-50"
                            >
                                <span className="text-xl">{getAmenityIcon(amenity)}</span>
                                <span className="text-xs font-black text-gray-700">{amenity}</span>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'POLICIES' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Check-in Period Cards */}
                        <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-[24px] border border-neutral-100">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                    <Clock size={16} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Check-in</p>
                                    <p className="text-sm font-black text-gray-800">{hotel.policies?.checkInTime || '12:00 PM'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                    <Clock size={16} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Check-out</p>
                                    <p className="text-sm font-black text-gray-800">{hotel.policies?.checkOutTime || '11:00 AM'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Rules List Grid */}
                        <div className="space-y-3">
                            {[
                                { label: 'Couple Friendly', val: hotel.policies?.coupleFriendly, icon: ShieldCheck, desc: 'Safe for unmarried couples' },
                                { label: 'Pets Allowed', val: hotel.policies?.petsAllowed, icon: Dog, desc: 'Pet friendly property' },
                                { label: 'Smoking Allowed', val: hotel.policies?.smokingAllowed, icon: Cigarette, desc: 'Designated smoking areas' },
                                { label: 'Local IDs Allowed', val: hotel.policies?.localIdsAllowed, icon: ShieldCheck, desc: 'Local residents accepted' },
                                { label: 'Alcohol Allowed', val: hotel.policies?.alcoholAllowed, icon: ShieldCheck, desc: 'Permitted in private rooms' },
                                { label: 'Suitable for Events', val: hotel.policies?.forEvents, icon: ShieldCheck, desc: 'Social gatherings allowed' },
                                { label: 'Outside Food Allowed', val: hotel.policies?.outsideFoodAllowed, icon: ShieldCheck, desc: 'Delivery orders permitted' },
                            ].map((rule, i) => (
                                <div 
                                    key={i} 
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                        rule.val 
                                            ? 'bg-emerald-50/20 border-emerald-100/50' 
                                            : 'bg-neutral-50/40 border-neutral-100/70'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <rule.icon size={18} className={rule.val ? 'text-emerald-600' : 'text-neutral-400'} />
                                        <div>
                                            <p className="text-xs font-black text-gray-800">{rule.label}</p>
                                            <p className="text-[10px] font-bold text-gray-400">{rule.desc}</p>
                                        </div>
                                    </div>
                                    {rule.val ? (
                                        <span className="text-[9px] font-black bg-emerald-100/60 text-emerald-600 px-2.5 py-1 rounded-lg uppercase tracking-wider">Allowed</span>
                                    ) : (
                                        <span className="text-[9px] font-black bg-neutral-100 text-neutral-400 px-2.5 py-1 rounded-lg uppercase tracking-wider">Restricted</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'RATINGS' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Breakdown Metrics */}
                        <div className="bg-neutral-50 p-6 rounded-[24px] border border-neutral-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-3xl font-[1000] text-gray-900">{hotel.rating || 4.2}</span>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-blue-600 uppercase tracking-wider">Out of 5 Stars</span>
                                        <span className="text-[10px] font-bold text-gray-400">{hotel.reviewsCount || 48} ratings</span>
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={16} fill={i < Math.round(hotel.rating || 4.2) ? '#2563eb' : 'none'} className={i < Math.round(hotel.rating || 4.2) ? 'text-blue-600' : 'text-gray-300'} />
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-xs font-black text-gray-600">
                                {[
                                    { label: 'Cleanliness', score: '4.8' },
                                    { label: 'Location', score: '4.6' },
                                    { label: 'Check-In', score: '4.7' },
                                    { label: 'Value for Money', score: '4.5' },
                                ].map((metric, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 tracking-wide">
                                            <span>{metric.label}</span>
                                            <span className="text-gray-700">{metric.score}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${parseFloat(metric.score) * 20}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Guest Reviews list */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Guest Feedback</h4>
                            {reviewsList.map((review: any, i: number) => (
                                <div key={i} className="p-5 bg-white border border-neutral-100 rounded-[24px] space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h5 className="text-xs font-black text-gray-800">{review.name}</h5>
                                            <span className="text-[9px] font-bold text-gray-400">{review.date}</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-lg">
                                            <Star size={11} fill="#2563eb" className="text-blue-600" />
                                            <span className="text-[10px] font-black text-blue-600">{review.score}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-500 leading-relaxed italic">
                                        "{review.text}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
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
