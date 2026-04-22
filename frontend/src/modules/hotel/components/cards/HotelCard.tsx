import React, { useState } from 'react';
import { MapPin, Star, BedDouble, Wifi, Dumbbell, Heart, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=800&q=80";

interface HotelCardProps {
    id: string;
    image?: string;
    name: string;
    location: string;
    price: number | string;
    rating?: number;
    amenities?: string[];
    className?: string;
}

const HotelCard: React.FC<HotelCardProps> = ({
    id,
    image,
    name,
    location,
    price,
    rating = 4.5,
    className
}) => {
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const displayImage = (image && !imgError) ? image : PLACEHOLDER_IMAGE;

    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/store/travel/hotels/detail/${id}`)}
            className={`bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100/50 cursor-pointer group transition-all hover:shadow-xl hover:shadow-gray-200/50 ${className}`}
        >
            {/* Image Section */}
            <div className="relative h-48 w-full overflow-hidden">
                <img
                    src={displayImage}
                    alt={name}
                    onError={() => setImgError(true)}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Save Button */}
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsSaved(!isSaved); }}
                    className="absolute top-4 left-4 bg-white/20 backdrop-blur-md p-2 rounded-full shadow-lg transition-colors hover:bg-white/40"
                >
                    <Heart size={18} className={isSaved ? "fill-red-500 text-red-500" : "text-white"} />
                </button>

                {/* Rating Badge */}
                <div className="absolute top-4 right-4 bg-gray-900/40 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-white/20">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-white text-xs font-[1000]">{rating}</span>
                </div>

                {/* Price Overlaid Bottom */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="bg-hotel-DEFAULT px-4 py-2 rounded-2xl shadow-lg border border-hotel-light/20">
                        <span className="text-white font-[1000] text-sm">₹{price}</span>
                        <span className="text-white/70 text-[9px] font-black uppercase tracking-tighter pl-1">/night</span>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5">
                <h3 className="text-lg font-[1000] text-gray-900 leading-tight mb-2 group-hover:text-hotel-DEFAULT transition-colors truncate">
                    {name}
                </h3>
                
                <div className="flex items-center gap-1 text-gray-400 mb-4">
                    <MapPin size={12} className="shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wider truncate">{location}</span>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-3 gap-2 py-4 border-t border-gray-50 mt-auto">
                    <div className="flex flex-col items-center gap-1">
                        <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-hotel-light/10 group-hover:text-hotel-DEFAULT transition-colors">
                            <BedDouble size={16} />
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase">2 Beds</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-hotel-light/10 group-hover:text-hotel-DEFAULT transition-colors">
                            <Wifi size={16} />
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase">Free WiFi</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-hotel-light/10 group-hover:text-hotel-DEFAULT transition-colors">
                            <Dumbbell size={16} />
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase">Gym</span>
                    </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                     <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full">
                        Fully Refundable
                     </span>
                     <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-hotel-DEFAULT group-hover:text-white transition-all transform group-hover:translate-x-1">
                        <ChevronRight size={14} strokeWidth={3} />
                     </div>
                </div>
            </div>
        </motion.div>
    );
};

export default HotelCard;
