import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Check, X, Loader2, Info, Building2, Key, Users, Sparkles, Award } from 'lucide-react';
import { getMyHotels, getHotelRooms, addHotelRoom, updateHotelRoomStatus, Hotel, HotelRoom } from '../../../services/api/hotelPartnerService';
import { motion, AnimatePresence } from 'framer-motion';

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
        amenities: ['Free WiFi', 'AC', 'TV', 'Scenic View', 'Mini Bar']
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
                    amenities: ['Free WiFi', 'AC', 'TV', 'Scenic View', 'Mini Bar'] 
                });
            }
        } catch (e) {
            alert("Failed to add room: " + ((e as any).response?.data?.message || "Server Error"));
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (roomId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Available' ? 'Full' : 'Available';
        try {
            const res = await updateHotelRoomStatus(roomId, newStatus);
            if (res.success) {
                setRooms(rooms.map(r => r._id === roomId ? { 
                    ...r, 
                    availabilityStatus: newStatus as any, 
                    status: newStatus as any 
                } : r));
            }
        } catch (e) {
            alert("Failed to update status");
        }
    };

    return (
        <div className="space-y-10 pb-12 font-['Inter']">
            {/* Header / Selector Card */}
            <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-neutral-950 p-8 md:p-12 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-emerald-500/10">
                <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <Sparkles size={14} className="text-amber-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Inventory Hub</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-none">Hotel Inventory</h2>
                        <p className="text-xs md:text-sm text-neutral-400 font-bold uppercase tracking-widest leading-none">Manage Room Types & Daily Room Allotments</p>
                    </div>
                    
                    {hotels.length > 0 && (
                        <div className="flex flex-wrap gap-2.5 bg-white/5 border border-white/10 p-2.5 rounded-[2rem] w-full xl:w-auto relative z-20">
                            {hotels.map(h => (
                                <button 
                                    key={h._id} 
                                    onClick={() => handleHotelSelect(h)}
                                    className={`flex-1 xl:flex-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                                        activeHotel?._id === h._id 
                                        ? 'bg-white text-neutral-900 shadow-xl scale-[1.02]' 
                                        : 'bg-transparent text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {h.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Aesthetic Gradients */}
                <div className="absolute right-[-10%] top-[-20%] w-[25rem] h-[25rem] bg-gradient-to-br from-emerald-500/15 to-transparent rounded-full blur-[100px] pointer-events-none" />
            </div>

            {/* Main Content Area */}
            {hotels.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-24 text-center border border-neutral-100 shadow-sm space-y-6">
                    <div className="w-20 h-20 bg-neutral-50 text-neutral-300 rounded-[1.5rem] flex items-center justify-center mx-auto">
                        <Info size={40} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-neutral-800 tracking-tight">No Properties Registered</h3>
                        <p className="text-neutral-400 text-sm font-medium mt-1">Add your properties or verify system verification status first.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/seller/hotel/add')}
                        className="bg-emerald-500 text-white px-10 py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all hover:bg-emerald-600 duration-300"
                    >
                        Add Your First Hotel
                    </button>
                </div>
            ) : !activeHotel ? (
                <div className="text-center py-24 space-y-4">
                    <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto" />
                    <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Loading Property Inventory...</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Live Metric Counter */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { label: 'Room Categories', value: rooms.length, icon: Award, bg: 'bg-emerald-50', color: 'text-emerald-600' },
                          { label: 'Active Allotment', value: rooms.reduce((sum, r) => sum + (r.totalRooms || 0), 0), icon: Key, bg: 'bg-sky-50', color: 'text-sky-600' },
                          { label: 'Max Guest Capacity', value: rooms.reduce((sum, r) => sum + (r.capacity || 0) * (r.totalRooms || 0), 0), icon: Users, bg: 'bg-amber-50', color: 'text-amber-600' }
                        ].map((metric) => (
                            <div key={metric.label} className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex items-center gap-5">
                                <div className={`w-14 h-14 ${metric.bg} ${metric.color} rounded-2xl flex items-center justify-center`}>
                                    <metric.icon size={26} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{metric.label}</p>
                                    <h4 className="text-2xl font-black text-neutral-800 mt-0.5">{metric.value}</h4>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rooms.map((room) => (
                            <motion.div 
                                layout
                                key={room._id} 
                                className="bg-white rounded-[2.5rem] overflow-hidden border border-neutral-100 shadow-sm hover:shadow-2xl hover:border-emerald-500/10 transition-all duration-300 group flex flex-col justify-between"
                            >
                                <div className="p-8 space-y-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h3 className="text-xl font-black text-neutral-800 tracking-tight leading-tight">{room.roomType}</h3>
                                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1 inline-block">Total: {room.totalRooms} Rooms</span>
                                        </div>
                                        <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                            (room.status || 'Available') === 'Available' 
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                                        }`}>
                                            {room.status || 'Available'}
                                        </span>
                                    </div>

                                    <p className="text-xs font-bold text-neutral-500 leading-relaxed line-clamp-3 min-h-[3rem]">{room.description}</p>

                                    {/* Room Attributes */}
                                    <div className="flex items-center gap-6 py-5 border-y border-neutral-50 my-4">
                                        <div>
                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Price / Night</p>
                                            <p className="text-xl font-black text-neutral-800 mt-0.5">₹{room.pricePerNight?.toLocaleString()}</p>
                                        </div>
                                        <div className="h-8 w-px bg-neutral-100" />
                                        <div>
                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Max Guests</p>
                                            <p className="text-sm font-black text-neutral-700 mt-1">{room.capacity} Adults</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => toggleStatus(room._id, room.status || 'Available')}
                                            className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all duration-300 ${
                                                (room.status || 'Available') === 'Available' 
                                                ? 'border-rose-100 hover:border-rose-200 text-rose-600 hover:bg-rose-50' 
                                                : 'border-emerald-100 hover:border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                            }`}
                                        >
                                            {(room.status || 'Available') === 'Available' ? <X size={14} /> : <Check size={14} />}
                                            {(room.status || 'Available') === 'Available' ? 'Mark as Full' : 'Open Sales'}
                                        </button>
                                        <button className="p-4 bg-neutral-50 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 rounded-xl transition-all border border-neutral-100">
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        
                        {/* Add Card */}
                        {!isAdding && (
                            <button 
                                onClick={() => setIsAdding(true)}
                                className="min-h-[300px] bg-neutral-50 rounded-[2.5rem] border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-4 text-neutral-400 hover:border-emerald-500 hover:text-emerald-500 transition-all duration-300 shadow-sm"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center border border-neutral-100">
                                    <Plus size={26} />
                                </div>
                                <span className="font-black uppercase text-[10px] tracking-widest">Add New Room Type</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Add Room Modal */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-neutral-100"
                        >
                            <div className="p-10 md:p-14 space-y-8">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black text-neutral-900 tracking-tight">New Room Class</h3>
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Register room specifications & allotment details</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsAdding(false)} 
                                        className="p-3 bg-neutral-50 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 rounded-full transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Type Name</label>
                                        <input 
                                            type="text" 
                                            value={newRoom.roomType}
                                            onChange={(e) => setNewRoom({...newRoom, roomType: e.target.value})}
                                            placeholder="e.g. Deluxe Suite, Premium Penthouse"
                                            className="w-full bg-neutral-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-4.5 font-black text-sm outline-none transition-all duration-300 text-neutral-800"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Room Description</label>
                                        <textarea 
                                            value={newRoom.description}
                                            onChange={(e) => setNewRoom({...newRoom, description: e.target.value})}
                                            placeholder="Describe room features, amenities and views..."
                                            className="w-full bg-neutral-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-4.5 font-black text-sm outline-none transition-all duration-300 text-neutral-800"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Price / Night</label>
                                            <input 
                                                type="number" 
                                                value={newRoom.pricePerNight}
                                                onChange={(e) => setNewRoom({...newRoom, pricePerNight: Number(e.target.value)})}
                                                className="w-full bg-neutral-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-4 text-sm font-black outline-none transition-all duration-300 text-neutral-800"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Total Rooms</label>
                                            <input 
                                                type="number" 
                                                value={newRoom.totalRooms}
                                                onChange={(e) => setNewRoom({...newRoom, totalRooms: Number(e.target.value)})}
                                                className="w-full bg-neutral-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-4 text-sm font-black outline-none transition-all duration-300 text-neutral-800"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Adult Capacity</label>
                                            <input 
                                                type="number" 
                                                value={newRoom.capacity}
                                                onChange={(e) => setNewRoom({...newRoom, capacity: Number(e.target.value)})}
                                                className="w-full bg-neutral-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-4 text-sm font-black outline-none transition-all duration-300 text-neutral-800"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleAddRoom}
                                    disabled={loading}
                                    className="w-full mt-8 bg-emerald-500 hover:bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all duration-300"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
                                    Register Room Type
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RoomsManagement;
