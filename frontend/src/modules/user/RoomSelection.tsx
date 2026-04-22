import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Wifi, Wind, Tv, Coffee } from 'lucide-react';
import { getHotelDetails } from '../../services/api/customerHotelService';

const RoomSelection: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [selectedRooms, setSelectedRooms] = React.useState<{ [id: string]: number }>({});
    const [hotel, setHotel] = React.useState<any>(null);
    const [rooms, setRooms] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchDetail = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await getHotelDetails(id);
            if (response.success) {
                setHotel(response.data.hotel);
                setRooms(response.data.rooms || []);
            }
        } catch (error) {
            console.error('Failed to fetch room details:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchDetail();
    }, [id]);

    const totalRoomsCount = Object.values(selectedRooms).reduce((sum, qty) => sum + qty, 0);

    const handleAdd = (roomId: string) => {
        setSelectedRooms(prev => ({
            ...prev,
            [roomId]: (prev[roomId] || 0) + 1
        }));
    };

    const handleRemove = (roomId: string) => {
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
        const room = rooms.find(r => (r._id || r.id).toString() === roomId);
        return { room, qty };
    }).filter(item => item.room);

    const totalPrice = selectedRoomDetails.reduce((sum, item) => {
        const p = item.room?.basePrice || item.room?.pricePerNight || 0;
        return sum + p * item.qty;
    }, 0);
    
    const totalTaxes = selectedRoomDetails.reduce((sum, item) => sum + (item.room?.tax || 0) * item.qty, 0);
    const totalOriginalPrice = selectedRoomDetails.reduce((sum, item) => {
        const p = item.room?.originalPrice || (item.room?.basePrice || item.room?.pricePerNight || 0) * 1.25;
        return sum + p * item.qty;
    }, 0);

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
                        {hotel?.name || 'Loading...'}, {hotel?.city}
                    </h2>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Available Rooms · {totalRoomsCount} Room{totalRoomsCount !== 1 ? 's' : ''} selected
                    </p>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="bg-white px-4 py-3 flex items-center gap-2 overflow-x-auto hide-scrollbar border-b border-gray-100">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex-shrink-0">Amenities</span>
                {hotel?.amenities?.map((amenity: string, idx: number) => (
                    <button key={idx} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full whitespace-nowrap active:scale-95 transition-all">
                        <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">{amenity}</span>
                    </button>
                ))}
            </div>

            {/* Room List */}
            <main className="p-4 space-y-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-sm font-bold text-gray-400">Loading rooms...</p>
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-gray-200">
                        <p className="text-sm font-bold text-gray-500">No rooms available for this hotel.</p>
                    </div>
                ) : rooms.map((room) => {
                    const roomId = (room._id || room.id).toString();
                    const quantity = selectedRooms[roomId] || 0;
                    const isSelected = quantity > 0;
                    const name = room.roomType || room.name || 'Standard Room';
                    const size = room.roomSize ? `${room.roomSize} sq.ft` : '250 sq.ft';
                    const occupancy = `${room.guestCapacity || room.capacity || 2} Adults`;
                    const image = room.mainImage || (room.images && room.images[0]) || 'https://images.unsplash.com/photo-1590490360182-c33d57733427';
                    const price = room.basePrice || room.pricePerNight || 0;
                    const taxes = room.tax || 0;
                    const originalPrice = room.originalPrice || price;

                    const roomAmenities = [
                        { icon: <Wifi size={16} />, label: 'Free WiFi' },
                        { icon: <Wind size={16} />, label: 'Air Conditioning' },
                        { icon: <Tv size={16} />, label: 'Smart TV' },
                        { icon: <Coffee size={16} />, label: 'Coffee Maker' }
                    ].slice(0, 4);

                    return (
                        <div 
                            key={roomId} 
                            className={`bg-white rounded-[32px] overflow-hidden shadow-sm border-2 transition-all duration-300 ${isSelected ? 'border-blue-500 shadow-blue-100 shadow-xl' : 'border-gray-50'}`}
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-xl font-[1000] text-gray-900 leading-tight flex-1">{name}</h3>
                                    {isSelected && (
                                        <div className="bg-blue-600 text-white p-1 rounded-full animate-in zoom-in duration-300">
                                            <Check size={14} strokeWidth={4} />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                                    {size} · {occupancy}
                                </p>

                                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-6 bg-gray-100">
                                    <img src={image} alt={name} className="w-full h-full object-cover" />
                                </div>

                                <div className="grid grid-cols-2 gap-y-4 mb-6">
                                    {roomAmenities.map((amenity, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className="text-gray-400">{amenity.icon}</div>
                                            <span className="text-xs font-bold text-gray-700">{amenity.label}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className={`rounded-[24px] border-2 p-5 relative overflow-hidden transition-colors duration-300 ${isSelected ? 'border-blue-500/20 bg-blue-50/30' : 'border-gray-100 bg-gray-50/30'}`}>
                                    <h4 className="text-[11px] font-[1000] text-gray-400 mb-4 uppercase tracking-[0.2em]">Inclusions</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <Check size={14} className="text-emerald-500 mt-0.5" />
                                            <span className="text-[11px] font-black text-gray-700">Breakfast Included</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Check size={14} className="text-emerald-500 mt-0.5" />
                                            <span className="text-[11px] font-black text-gray-700">Free Cancellation (24h)</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-6">
                                        {!isSelected ? (
                                            <button 
                                                onClick={() => handleAdd(roomId)}
                                                className="w-full py-3.5 rounded-xl bg-white text-blue-600 border-2 border-blue-100 font-black text-[12px] uppercase tracking-widest active:scale-[0.98] transition-all hover:bg-blue-50/50"
                                            >
                                                Select Room
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => setSelectedRooms(prev => {
                                                    const newRooms = { ...prev };
                                                    delete newRooms[roomId];
                                                    return newRooms;
                                                })}
                                                className="w-full py-3.5 rounded-xl bg-blue-600 text-white border-2 border-blue-600 font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all"
                                            >
                                                <Check size={16} strokeWidth={4} />
                                                Selected
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-emerald-50 px-5 py-3 flex items-center justify-between border-t border-emerald-100">
                                <span className="text-[11px] font-black text-emerald-700 uppercase tracking-tighter">
                                    Best price guaranteed with FKHOTELS
                                </span>
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
                            + ₹{totalTaxes.toLocaleString()} TAXES & FEES
                        </span>
                    </div>
                </div>
                
                <button 
                    disabled={totalRoomsCount === 0}
                    onClick={() => {
                        const bookingData = {
                            type: 'hotel',
                            hotelId: hotel?._id || hotel?.id,
                            hotelName: hotel?.name,
                            hotelAddress: hotel?.address || (hotel?.city ? `${hotel.city}, ${hotel.state}` : 'Address not available'),
                            hotelImage: hotel?.mainImage || (hotel?.images && hotel?.images[0]?.url) || 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
                            checkIn: new Date().toISOString().split('T')[0],
                            checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                            rooms: selectedRoomDetails.map(item => ({
                                id: item.room._id || item.room.id,
                                name: item.room.roomType || item.room.name,
                                price: item.room.basePrice || item.room.pricePerNight || 0,
                                qty: item.qty
                            })),
                            totalPrice,
                            totalTaxes,
                            totalAmount: totalPrice + totalTaxes
                        };
                        localStorage.setItem('activeTravelBooking', JSON.stringify(bookingData));
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
