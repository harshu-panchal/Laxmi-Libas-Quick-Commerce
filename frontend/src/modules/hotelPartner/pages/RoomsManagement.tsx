import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Check, X, Loader2, Camera, Info } from 'lucide-react';
import { getMyHotels, getHotelRooms, addHotelRoom, updateHotelRoomStatus, Hotel, HotelRoom } from '../../../services/api/hotelPartnerService';

const RoomsManagement: React.FC = () => {
    const navigate = useNavigate();
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [activeHotel, setActiveHotel] = useState<Hotel | null>(null);
    const [rooms, setRooms] = useState<HotelRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    const [newRoom, setNewRoom] = useState({
        roomType: '',
        description: '',
        pricePerNight: 0,
        capacity: 2,
        totalRooms: 10,
        amenities: ['Free WiFi', 'AC', 'TV']
    });

    useEffect(() => {
        fetchHotels();
    }, []);

    const fetchHotels = async () => {
        setLoading(true);
        try {
            const res = await getMyHotels();
            if (res.success && res.data.length > 0) {
                setHotels(res.data);
                handleHotelSelect(res.data[0]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleHotelSelect = async (hotel: Hotel) => {
        setActiveHotel(hotel);
        setLoading(true);
        try {
            const res = await getHotelRooms(hotel._id);
            if (res.success) setRooms(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRoom = async () => {
        if (!activeHotel) return;
        setLoading(true);
        try {
            const res = await addHotelRoom({ 
                ...newRoom, 
                hotelId: activeHotel._id,
                availableRooms: newRoom.totalRooms // Matches backend requirement
            });
            if (res.success) {
                setRooms([...rooms, res.data]);
                setIsAdding(false);
                setNewRoom({ 
                    roomType: '', 
                    description: '',
                    pricePerNight: 0, 
                    capacity: 2, 
                    totalRooms: 10, 
                    amenities: ['Free WiFi', 'AC', 'TV'] 
                });
            }
        } catch (e) {
            alert("Failed to add room: " + (e as any).response?.data?.message || "Server Error");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (roomId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Available' ? 'Full' : 'Available';
        try {
            const res = await updateHotelRoomStatus(roomId, newStatus);
            if (res.success) {
                setRooms(rooms.map(r => r._id === roomId ? { ...r, availabilityStatus: newStatus as any } : r));
            }
        } catch (e) {
            alert("Failed to update status");
        }
    };

    return (
        <div className="space-y-8 pb-10 font-['Inter']">
            {/* Property Selector */}
            <div className="bg-white p-8 rounded-[40px] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-gray-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-[1000] text-gray-900 tracking-tight">Hotel Inventory</h2>
                        <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-[0.2em] leading-none">Manage Room Types & Daily Allotment</p>
                    </div>
                    
                    {hotels.length > 0 && (
                        <div className="flex flex-wrap gap-2 bg-gray-50 p-2 rounded-[24px]">
                            {hotels.map(h => (
                                <button 
                                    key={h._id} 
                                    onClick={() => handleHotelSelect(h)}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeHotel?._id === h._id ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
                                >
                                    {h.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            {hotels.length === 0 ? (
                <div className="bg-white rounded-[48px] p-20 text-center border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Info size={40} className="text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-[1000] text-gray-900 mb-2">No Properties Found</h3>
                    <p className="text-gray-500 font-bold mb-8">You haven't added any hotels or they are pending system sync.</p>
                    <button 
                        onClick={() => navigate('/seller/hotel/add')}
                        className="bg-teal-600 text-white px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-teal-600/20 active:scale-95 transition-all hover:bg-teal-700"
                    >
                        Add Your First Hotel
                    </button>
                </div>
            ) : !activeHotel ? (
                <div className="text-center py-20">
                    <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-4" />
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Loading Property Data...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                    <div key={room._id} className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-xl font-[1000] text-gray-900">{room.roomType}</h3>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Limit: {room.totalRooms} Rooms</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${room.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {room.status}
                                </span>
                            </div>

                            <p className="text-xs font-bold text-gray-500 line-clamp-2 min-h-[2rem]">{room.description}</p>

                            <div className="flex items-center gap-4 py-4 border-y border-gray-50 my-4">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Rate</p>
                                    <p className="text-xl font-[1000] text-gray-900">₹{room.pricePerNight}</p>
                                </div>
                                <div className="h-8 w-px bg-gray-100" />
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capacity</p>
                                    <p className="text-sm font-black text-gray-700">{room.capacity} Adults</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    onClick={() => toggleStatus(room._id, room.status)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${room.status === 'Available' ? 'border-red-100 text-red-500 hover:bg-red-50' : 'border-green-100 text-green-500 hover:bg-green-50'}`}
                                >
                                    {room.availabilityStatus === 'Available' ? <X size={14} /> : <Check size={14} />}
                                    {room.availabilityStatus === 'Available' ? 'Mark as Full' : 'Open Sales'}
                                </button>
                                <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all">
                                    <Edit2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Add Card */}
                {!isAdding && (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="h-full min-h-[250px] bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 text-gray-400 hover:border-teal-600 hover:text-teal-600 transition-all"
                    >
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100">
                            <Plus size={24} />
                        </div>
                        <span className="font-black uppercase text-xs tracking-widest text-[10px]">Add New Room Type</span>
                    </button>
                )}
            </div>
            )}

            {/* Add Room Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="bg-white rounded-[48px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-3xl font-[1000] text-gray-900 tracking-tight">New Room Class</h3>
                                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type Name</label>
                                        <input 
                                            type="text" 
                                            value={newRoom.roomType}
                                            onChange={(e) => setNewRoom({...newRoom, roomType: e.target.value})}
                                            placeholder="e.g. Deluxe Suite"
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-teal-600 focus:bg-white rounded-2xl p-4 font-black outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Room Description</label>
                                        <textarea 
                                            value={newRoom.description}
                                            onChange={(e) => setNewRoom({...newRoom, description: e.target.value})}
                                            placeholder="Describe room features..."
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-teal-600 focus:bg-white rounded-2xl p-4 font-black outline-none transition-all"
                                            rows={2}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price / Night (INR)</label>
                                        <input 
                                            type="number" 
                                            value={newRoom.pricePerNight}
                                            onChange={(e) => setNewRoom({...newRoom, pricePerNight: Number(e.target.value)})}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-teal-600 focus:bg-white rounded-2xl p-4 font-black outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Total Rooms</label>
                                        <input 
                                            type="number"
                                            value={newRoom.totalRooms}
                                            onChange={(e) => setNewRoom({...newRoom, totalRooms: Number(e.target.value)})}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-teal-600 focus:bg-white rounded-2xl p-4 font-black outline-none transition-all"
                                        />

                                        
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Adult Capacity</label>
                                        <input 
                                            type="number" 
                                            value={newRoom.capacity}
                                            onChange={(e) => setNewRoom({...newRoom, capacity: Number(e.target.value)})}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-teal-600 focus:bg-white rounded-2xl p-4 font-black outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleAddRoom}
                                disabled={loading}
                                className="w-full mt-10 bg-teal-600 text-white py-5 rounded-3xl font-[1000] text-lg uppercase tracking-widest shadow-xl shadow-teal-600/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-teal-700"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Plus />}
                                Register Room Type
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomsManagement;
