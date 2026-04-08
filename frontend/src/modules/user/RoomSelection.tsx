import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wifi, Tv, Wind, Coffee, ChevronRight, X, Check, Utensils, ShieldCheck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { hotels } from './data/hotels';

const RoomSelection: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [selectedRooms, setSelectedRooms] = React.useState<{ [id: number]: number }>({ 1: 1 });

    const hotel = hotels.find(h => h.id === Number(id));

    const rooms = [
        {
            id: 1,
            name: 'Premium Room with Balcony',
            size: '312 sq.ft',
            occupancy: '3 Adults',
            image: '/hotel_resort_2.png',
            amenities: [
                { icon: <Wifi size={16} />, label: 'WiFi access' },
                { icon: <ShieldCheck size={16} />, label: 'Blanket' },
                { icon: <Tv size={16} />, label: 'TV' },
                { icon: <Wind size={16} />, label: 'Air conditioning' },
            ],
            price: 25758,
            originalPrice: 37000,
            taxes: 3415,
            inclusions: [
                { icon: <X size={14} className="text-red-400" />, label: 'No meals included', active: false },
                { icon: <X size={14} className="text-red-400" />, label: 'Non-refundable', active: false },
                { icon: <Check size={14} className="text-emerald-500" />, label: '15% Discount on food & beverages', active: true },
            ]
        },
        {
            id: 2,
            name: 'Luxury Suite with Sea View',
            size: '520 sq.ft',
            occupancy: '4 Adults',
            image: '/hotel_resort_1.png',
            amenities: [
                { icon: <Wifi size={16} />, label: 'WiFi access' },
                { icon: <ShieldCheck size={16} />, label: 'Private Terrace' },
                { icon: <Tv size={16} />, label: '65" Smart TV' },
                { icon: <Utensils size={16} />, label: 'Mini Bar' },
            ],
            price: 42500,
            originalPrice: 55000,
            taxes: 5200,
            inclusions: [
                { icon: <Check size={14} className="text-emerald-500" />, label: 'Breakfast Included', active: true },
                { icon: <Check size={14} className="text-emerald-500" />, label: 'Free Cancellation', active: true },
                { icon: <Check size={14} className="text-emerald-500" />, label: 'Welcome Drinks', active: true },
            ]
        },
        {
            id: 3,
            name: 'Standard Deluxe Room',
            size: '280 sq.ft',
            occupancy: '2 Adults',
            image: '/hotel_resort_3.png',
            amenities: [
                { icon: <Wifi size={16} />, label: 'WiFi access' },
                { icon: <Tv size={16} />, label: 'LED TV' },
                { icon: <Wind size={16} />, label: 'Air conditioning' },
            ],
            price: 18500,
            originalPrice: 24000,
            taxes: 2100,
            inclusions: [
                { icon: <X size={14} className="text-red-400" />, label: 'No meals included', active: false },
                { icon: <Check size={14} className="text-emerald-500" />, label: 'High-speed Internet', active: true },
            ]
        }
    ];

    const totalRoomsCount = Object.values(selectedRooms).reduce((sum, qty) => sum + qty, 0);

    const handleAdd = (roomId: number) => {
        setSelectedRooms(prev => ({
            ...prev,
            [roomId]: (prev[roomId] || 0) + 1
        }));
    };

    const handleRemove = (roomId: number) => {
        setSelectedRooms(prev => {
            const newRooms = { ...prev };
            if (newRooms[roomId] > 1) {
                newRooms[roomId] -= 1;
            } else {
                delete newRooms[roomId];
            }
            return newRooms;
        });
    };

    const selectedRoomDetails = Object.entries(selectedRooms).map(([roomId, qty]) => {
        const room = rooms.find(r => r.id === parseInt(roomId));
        return { room, qty };
    }).filter(item => item.room);

    const totalPrice = selectedRoomDetails.reduce((sum, item) => sum + (item.room?.price || 0) * item.qty, 0);
    const totalOriginalPrice = selectedRoomDetails.reduce((sum, item) => sum + (item.room?.originalPrice || 0) * item.qty, 0);
    const totalTaxes = selectedRoomDetails.reduce((sum, item) => sum + (item.room?.taxes || 0) * item.qty, 0);

    return (
        <div className="min-h-screen bg-[#f8f9fa] pb-24 font-['Inter']">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-4 shadow-sm">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-1 active:scale-90 transition-transform"
                >
                    <ArrowLeft size={24} className="text-gray-900" />
                </button>
                <div className="flex flex-col">
                    <h2 className="text-[15px] font-[1000] text-gray-900 truncate max-w-[250px]">
                        {hotel?.name || 'Loading...'}, {hotel?.location}
                    </h2>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        08 Apr - 09 Apr · {totalRoomsCount} Room{totalRoomsCount !== 1 ? 's' : ''} selected
                    </p>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="bg-white px-4 py-3 flex items-center gap-2 overflow-x-auto hide-scrollbar border-b border-gray-100">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex-shrink-0">Filter by</span>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full whitespace-nowrap active:scale-95 transition-all">
                    <Utensils size={14} className="text-gray-500" />
                    <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Breakfast Included</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full whitespace-nowrap active:scale-95 transition-all">
                    <Check size={14} className="text-gray-500" />
                    <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Free Cancellation</span>
                </button>
            </div>

            {/* Room List */}
            <main className="p-4 space-y-8">
                {rooms.map((room) => {
                    const quantity = selectedRooms[room.id] || 0;
                    const isSelected = quantity > 0;
                    
                    return (
                        <div 
                            key={room.id} 
                            className={`bg-white rounded-[32px] overflow-hidden shadow-sm border-2 transition-all duration-300 ${isSelected ? 'border-blue-500 shadow-blue-100 shadow-xl' : 'border-gray-50'}`}
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-xl font-[1000] text-gray-900 leading-tight flex-1">{room.name}</h3>
                                    {isSelected && (
                                        <div className="bg-blue-600 text-white p-1 rounded-full animate-in zoom-in duration-300">
                                            <Check size={14} strokeWidth={4} />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                                    {room.size} · {room.occupancy}
                                </p>

                                {/* Image Slider Placeholder */}
                                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-6 bg-gray-100">
                                    <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md font-bold">
                                        1/5
                                    </div>
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                        <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
                                        <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
                                        <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
                                        <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
                                    </div>
                                </div>

                                {/* Amenities Grid */}
                                <div className="grid grid-cols-2 gap-y-4 mb-6">
                                    {room.amenities.map((amenity, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className="text-gray-400">{amenity.icon}</div>
                                            <span className="text-xs font-bold text-gray-700">{amenity.label}</span>
                                        </div>
                                    ))}
                                </div>

                                <button className="text-blue-600 text-xs font-[1000] uppercase tracking-widest hover:underline flex items-center gap-1 mb-6">
                                    View all amenities
                                </button>

                                {/* Inclusions Box */}
                                <div className={`rounded-[24px] border-2 p-5 relative overflow-hidden transition-colors duration-300 ${isSelected ? 'border-blue-500/20 bg-blue-50/30' : 'border-gray-100 bg-gray-50/30'}`}>
                                    <h4 className="text-[11px] font-[1000] text-gray-400 mb-4 uppercase tracking-[0.2em]">Inclusions</h4>
                                    <div className="space-y-4">
                                        {room.inclusions.map((inclusion, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <div className="mt-0.5">{inclusion.icon}</div>
                                                <span className={`text-[11px] font-black tracking-tight ${inclusion.active ? 'text-gray-700' : 'text-gray-500'}`}>
                                                    {inclusion.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="mt-4 text-blue-600 text-[10px] font-[1000] uppercase tracking-widest hover:underline flex items-center gap-1">
                                        + 2 inclusions
                                    </button>
                                    
                                    {/* Select/Quantity Selector */}
                                    <div className="mt-6">
                                        {!isSelected ? (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAdd(room.id);
                                                }}
                                                className="w-full py-3.5 rounded-xl bg-white text-blue-600 border-2 border-blue-100 font-black text-[12px] uppercase tracking-widest active:scale-[0.98] transition-all hover:bg-blue-50/50"
                                            >
                                                Select Room
                                            </button>
                                        ) : (
                                            <div className="space-y-3">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedRooms(prev => {
                                                            const newRooms = { ...prev };
                                                            delete newRooms[room.id];
                                                            return newRooms;
                                                        });
                                                    }}
                                                    className="w-full py-3.5 rounded-xl bg-blue-600 text-white border-2 border-blue-600 font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all"
                                                >
                                                    <Check size={16} strokeWidth={4} />
                                                    Selected
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Floating Types Badge */}
                                    {room.id === 1 && (
                                        <div className="absolute top-8 right-4 bg-gray-900 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-xl">
                                            3 Room types
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Offers Banner */}
                            <div className="bg-emerald-50 px-5 py-3 flex items-center justify-between border-t border-emerald-100 group active:opacity-80 transition-opacity">
                                <div className="flex items-center gap-2">
                                    <div className="bg-emerald-500 text-white p-1 rounded-full">
                                        <Check size={10} strokeWidth={4} />
                                    </div>
                                    <span className="text-[11px] font-black text-emerald-700 uppercase tracking-tighter">
                                        FKHOTELS + 2 offers applied
                                    </span>
                                </div>
                                <ChevronRight size={14} className="text-emerald-400" />
                            </div>
                        </div>
                    );
                })}
            </main>

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-50">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 leading-none">
                        {totalOriginalPrice > totalPrice && (
                            <span className="text-[11px] font-bold text-gray-400 line-through">₹{totalOriginalPrice.toLocaleString()}</span>
                        )}
                        <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter">
                            {totalOriginalPrice > 0 ? Math.round((1 - totalPrice/totalOriginalPrice) * 100) : 0}% OFF
                        </span>
                    </div>
                    <div className="flex flex-col mt-0.5">
                        <span className="text-xl font-[1000] text-gray-900 leading-tight">₹{totalPrice.toLocaleString()}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                            + ₹{totalTaxes.toLocaleString()} TAXES & FEES / {totalRoomsCount} ROOM{totalRoomsCount !== 1 ? 'S' : ''}
                        </span>
                    </div>
                </div>
                
                <button 
                    disabled={totalRoomsCount === 0}
                    onClick={() => {
                        console.log('Continuing with rooms:', selectedRooms);
                        navigate('/store/travel/cart');
                    }}
                    className={`px-8 py-3.5 rounded-xl font-[1000] text-[12px] uppercase tracking-[0.1em] transition-all shadow-lg ${totalRoomsCount > 0 ? 'bg-yellow-400 text-gray-900 shadow-yellow-100 active:scale-95' : 'bg-gray-100 text-gray-400 shadow-none cursor-not-allowed'}`}
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default RoomSelection;
