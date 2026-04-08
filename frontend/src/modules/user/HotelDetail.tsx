import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Star, Share2, MapPin, ChevronRight, Check, Info, ShieldCheck, Clock, Ban, Cigarette, Dog, Map as MapIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { hotels } from './data/hotels';

const HotelDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    // Find the specific hotel from the shared data
    const hotel = hotels.find(h => h.id === Number(id));

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
            <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img 
                    src={hotel.images[0]} 
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
                        <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                            <Share2 size={20} className="text-gray-900" />
                        </button>
                    </div>
                </div>

                {/* Image Count Badge */}
                <div className="absolute bottom-16 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-lg border border-white/20 uppercase tracking-widest">
                    + 391 more
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
                            {hotel.rating}
                        </div>
                        <span className="text-blue-600 font-[900] text-sm uppercase tracking-tight">
                            {hotel.ratingText} · {hotel.ratingsCount} ratings
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
                            {hotel.stars}-star Resort in {hotel.location}
                        </span>
                    </div>
                </div>
            </div>

            {/* Highlights Section */}
            <div className="px-5 mt-8 grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 rounded-[24px] p-4 border border-gray-100 flex flex-col items-center text-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 text-center">Top Rated</span>
                    <div className="relative mb-2">
                        <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-20 transform -scale-x-100 italic">🌿</div>
                        <span className="text-sm font-black text-gray-900 leading-tight">Central Location</span>
                        <div className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-20 italic">🌿</div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">10+ mentions</span>
                </div>

                <div className="bg-cyan-50/30 rounded-[24px] p-4 border border-cyan-100/50 flex flex-col items-center">
                    <span className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.2em] mb-3">In the Spotlight</span>
                    <div className="flex flex-wrap justify-center gap-1.5">
                        <span className="text-[11px] font-black text-cyan-700 tracking-tight">Scenic</span>
                        <span className="text-cyan-300 text-[8px] self-center">✦</span>
                        <span className="text-[11px] font-black text-cyan-700 tracking-tight">Relaxing</span>
                        <span className="text-cyan-300 text-[8px] self-center">✦</span>
                        <span className="text-[11px] font-black text-cyan-700 tracking-tight">Tasty</span>
                    </div>
                </div>
            </div>

            {/* AI Generated Tag */}
            <p className="px-5 mt-3 text-[10px] font-bold text-gray-400 italic text-center">
                AI generated highlights from recent guest reviews
            </p>

            {/* Savings Banner */}
            <div className="px-5 mt-8">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500 text-white p-1.5 rounded-full shadow-sm">
                            <Check size={14} strokeWidth={4} />
                        </div>
                        <span className="text-xs font-black text-emerald-700 tracking-tight">
                            ₹3,000 saved with LAXMART!
                        </span>
                    </div>
                    <ChevronRight size={16} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
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
                        Nestled along the serene shores of Morjim, Foxoso LA Beach Resort offers a perfect blend of luxury and coastal charm. Our property features expansive ocean views, a state-of-the-art spa, and infinity pools designed for ultimate relaxation.
                    </p>
                    <p className="text-sm font-bold text-gray-600 leading-relaxed">
                        Each suite is meticulously designed with contemporary Goan aesthetics, featuring private balconies and premium linens to ensure a restful stay.
                    </p>
                    <button className="text-blue-600 text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:underline">
                        Read More <ChevronRight size={14} />
                    </button>
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
                                <p className="text-sm font-black text-gray-900">02:00 PM</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                                <Clock size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Check-out</p>
                                <p className="text-sm font-black text-gray-900">11:00 AM</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <Cigarette size={18} className="text-gray-400" />
                                <span className="text-xs font-black text-gray-700">Smoking Allowed</span>
                            </div>
                            <span className="text-[9px] font-black bg-gray-200 text-gray-500 px-2 py-1 rounded uppercase">Designated Areas</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <Dog size={18} className="text-gray-400" />
                                <span className="text-xs font-black text-gray-700">Pets Allowed</span>
                            </div>
                            <Ban size={16} className="text-red-400" />
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
                            Foxoso LA Beach Resort, Vithaldas Wada, Morjim, Goa 403512
                        </p>
                        <button className="mt-3 w-full bg-gray-50 py-3 rounded-xl text-blue-600 text-[11px] font-black uppercase tracking-widest border border-gray-100 active:scale-95 transition-all">
                            Get Directions
                        </button>
                    </div>
                </div>
            </div>

            <div className="h-20"></div> {/* Spacer for sticky footer */}

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-50">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 leading-none">
                        <span className="text-[11px] font-bold text-gray-400 line-through">₹{hotel.originalPrice.toLocaleString()}</span>
                        <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter">65% OFF</span>
                    </div>
                    <div className="flex flex-col mt-0.5">
                        <span className="text-xl font-[1000] text-gray-900 leading-tight">₹{hotel.price.toLocaleString()}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                            + ₹{hotel.taxes.toLocaleString()} TAXES & FEES
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
        </div>
    );
};

export default HotelDetail;
