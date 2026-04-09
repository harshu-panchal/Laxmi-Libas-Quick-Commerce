import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Users, ChevronRight, Zap, Lock, Star, Clock, MapPin, ShieldCheck, Heart, X, ArrowLeft, Share2, Home, Plane, Hotel, Bus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HotelBooking: React.FC = () => {
    const navigate = useNavigate();
    const checkInRef = React.useRef<HTMLInputElement>(null);
    const checkOutRef = React.useRef<HTMLInputElement>(null);

    const [dates, setDates] = React.useState({
        checkIn: '2026-03-31',
        checkOut: '2026-04-01'
    });
    const [showSearchOverlay, setShowSearchOverlay] = React.useState(false);
    const [selectedLocation, setSelectedLocation] = React.useState('City, Hotel or Area');
    const [searchQuery, setSearchQuery] = React.useState('');

    const trendingDestinations = [
        { name: 'Goa', sub: 'India', type: 'State', img: '/hotel_deal_1.png' },
        { name: 'Mumbai', sub: 'Maharashtra', type: 'City', img: '/hotel_deal_2.png' },
        { name: 'New Delhi', sub: 'Delhi', type: 'City', img: '/hotel_deal_3.png' },
        { name: 'Bangalore', sub: 'Karnataka', type: 'City', img: '/hotel_deal_1.png' },
    ];

    const [showGuestOverlay, setShowGuestOverlay] = React.useState(false);
    const [guestConfig, setGuestConfig] = React.useState([{ adults: 2, children: 0 }]);

    const updateGuestCount = (roomIdx: number, type: 'adults' | 'children', delta: number) => {
        setGuestConfig(prev => prev.map((room, idx) => {
            if (idx === roomIdx) {
                const newVal = room[type] + delta;
                if (type === 'adults' && newVal < 1) return room; // Min 1 adult
                if (type === 'children' && newVal < 0) return room; // Min 0 children
                return { ...room, [type]: newVal };
            }
            return room;
        }));
    };

    const addRoom = () => setGuestConfig(prev => [...prev, { adults: 1, children: 0 }]);

    const getGuestSummary = () => {
        const totalRooms = guestConfig.length;
        const totalAdults = guestConfig.reduce((acc, r) => acc + r.adults, 0);
        return `${totalRooms.toString().padStart(2, '0')} Room${totalRooms > 1 ? 's' : ''}, ${totalAdults.toString().padStart(2, '0')} Adult${totalAdults > 1 ? 's' : ''}`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', weekday: 'short' });
    };

    const destination = selectedLocation === 'City, Hotel or Area' ? '' : selectedLocation;
    const checkIn = dates.checkIn;
    const checkOut = dates.checkOut;
    const rooms = guestConfig;
    const totalAdults = guestConfig.reduce((acc, r) => acc + r.adults, 0);
    const setIsSearchOpen = setShowSearchOverlay;
    const setIsGuestSheetOpen = setShowGuestOverlay;
    const setCheckIn = (val: string) => setDates(prev => ({ ...prev, checkIn: val }));
    const setCheckOut = (val: string) => setDates(prev => ({ ...prev, checkOut: val }));

    const calculateNights = () => {
        const d1 = new Date(checkIn);
        const d2 = new Date(checkOut);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return nights > 0 ? nights : 1;
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col font-['Inter'] selection:bg-blue-100">
            {/* Rooms & Guests Overlay */}
            <AnimatePresence>
                {showGuestOverlay && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end"
                        onClick={() => setShowGuestOverlay(false)}
                    >
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full bg-white rounded-t-[32px] px-6 pt-6 pb-8 max-h-[85vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-[1000] text-gray-900 tracking-tight">Select Rooms & Guests</h2>
                                <button 
                                    onClick={() => setShowGuestOverlay(false)}
                                    className="p-1.5 bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {guestConfig.map((room, idx) => (
                                    <div key={idx} className="space-y-4">
                                        <h3 className="text-base font-[1000] text-gray-900 leading-none">Room {idx + 1}</h3>
                                        
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 leading-none">Adult</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">12+ Years</p>
                                            </div>
                                            <div className="flex items-center gap-4 bg-gray-50 p-1 rounded-full border border-neutral-100">
                                                <button 
                                                    onClick={() => updateGuestCount(idx, 'adults', -1)}
                                                    className="w-9 h-9 rounded-full border-2 border-blue-600 text-blue-600 flex items-center justify-center disabled:opacity-30 disabled:border-gray-300 disabled:text-gray-300 transition-all font-bold text-xl"
                                                    disabled={room.adults <= 1}
                                                >
                                                    −
                                                </button>
                                                <span className="text-base font-black text-gray-900 min-w-[18px] text-center">{room.adults}</span>
                                                <button 
                                                    onClick={() => updateGuestCount(idx, 'adults', 1)}
                                                    className="w-9 h-9 rounded-full border-2 border-blue-600 text-blue-600 flex items-center justify-center transition-all font-bold text-lg"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 leading-none">Child</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">1-11 years</p>
                                            </div>
                                            <div className="flex items-center gap-4 bg-gray-50 p-1 rounded-full border border-neutral-100">
                                                <button 
                                                    onClick={() => updateGuestCount(idx, 'children', -1)}
                                                    className="w-9 h-9 rounded-full border-2 border-blue-600 text-blue-600 flex items-center justify-center disabled:opacity-30 disabled:border-gray-300 disabled:text-gray-300 transition-all font-bold text-xl"
                                                    disabled={room.children <= 0}
                                                >
                                                    −
                                                </button>
                                                <span className="text-base font-black text-gray-900 min-w-[18px] text-center">{room.children}</span>
                                                <button 
                                                    onClick={() => updateGuestCount(idx, 'children', 1)}
                                                    className="w-9 h-9 rounded-full border-2 border-blue-600 text-blue-600 flex items-center justify-center transition-all font-bold text-lg"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        {idx < guestConfig.length - 1 && <div className="border-b border-dashed border-neutral-200 pt-2"></div>}
                                    </div>
                                ))}
                                <button 
                                    onClick={addRoom}
                                    className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider h-10"
                                >
                                    <span className="text-lg font-black">+</span> ADD ANOTHER ROOM
                                </button>
                            </div>
                            <motion.button 
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowGuestOverlay(false)}
                                className="w-full bg-blue-600 text-white font-[1000] py-3.5 rounded-2xl shadow-xl mt-6 text-base transition-transform uppercase tracking-wider"
                            >
                                Confirm
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search Destination Overlay */}
            <AnimatePresence>
                {showSearchOverlay && (
                    <motion.div 
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 bg-white z-[100] flex flex-col"
                    >
                        <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-4">
                            <button 
                                onClick={() => setShowSearchOverlay(false)}
                                className="p-2 -ml-2 rounded-full hover:bg-gray-100"
                            >
                                <ChevronRight size={24} className="rotate-180" />
                            </button>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Where to?</h2>
                        </div>

                        <div className="p-5">
                            <div className="relative group mb-8">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2563eb] transition-colors">
                                    <Search size={20} />
                                </div>
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search a location, landmark, etc."
                                    className="w-full bg-gray-50 border border-neutral-100 rounded-2xl py-4.5 pl-12 pr-4 text-base font-bold text-gray-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all"
                                />
                            </div>

                            <div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5">Trending Destinations</h3>
                                <div className="space-y-0.5">
                                    {trendingDestinations.map((dest, idx) => (
                                        <motion.div 
                                            key={idx}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setSelectedLocation(`${dest.name}, ${dest.sub}`);
                                                setShowSearchOverlay(false);
                                            }}
                                            className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm bg-gray-100">
                                                    <img src={dest.img} alt={dest.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-gray-900 leading-none">{dest.name}</h4>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">{dest.sub}</p>
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-wider">{dest.type}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header / Top Bar */}
            <div className="bg-[#f0fdf4]/90 backdrop-blur-xl sticky top-0 z-50 px-4 py-4 flex items-center justify-between border-b border-green-100/50 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3">
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-800" />
                    </motion.button>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 leading-none">Hotel Booking</h1>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter mt-1">Laxmart Travel Module</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <Share2 size={18} />
                    </motion.button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 px-2 pt-4 pb-12 overflow-y-auto hide-scrollbar">
                {/* Hero Text */}
                <div className="px-2 mb-8 mt-2">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h1 className="text-[2.5rem] font-[1000] text-gray-900 leading-[1.1] tracking-tight">
                            Find Your <br/>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-600">Dream Stay</span>
                        </h1>
                        <div className="h-1.5 w-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mt-4 shadow-sm"></div>
                    </motion.div>
                </div>

                {/* Search Card - Compact, Wide, Short */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-[32px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] p-5 relative overflow-visible border border-gray-100/50"
                >
                    <div className="space-y-4">
                        {/* Destination */}
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Where to?</label>
                            <div 
                                onClick={() => setIsSearchOpen(true)}
                                className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-2xl border border-transparent active:scale-[0.98] transition-all"
                            >
                                <div className="p-2 bg-white rounded-xl shadow-sm text-gray-400">
                                    <MapPin size={18} strokeWidth={2.5} />
                                </div>
                                <span className={`text-base font-black tracking-tight truncate ${destination ? 'text-gray-900' : 'text-gray-300'}`}>
                                    {destination || 'City, Hotel or Area'}
                                </span>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="flex gap-3">
                            <div className="flex-1 space-y-1 relative">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Check-in</label>
                                <div 
                                    className="p-3 bg-gray-50/80 rounded-2xl border border-transparent flex flex-col items-start gap-1 cursor-pointer active:scale-[0.98] transition-transform"
                                    onClick={() => checkInRef.current?.showPicker()}
                                >
                                    <Calendar size={16} className="text-red-400" strokeWidth={2.5} />
                                    <span className="text-sm font-black text-gray-900 tracking-tight mt-0.5">
                                        {formatDate(checkIn)}
                                    </span>
                                    <input 
                                        type="date" 
                                        ref={checkInRef}
                                        value={checkIn}
                                        onChange={(e) => setCheckIn(e.target.value)}
                                        className="absolute inset-0 opacity-0 pointer-events-none" 
                                    />
                                </div>
                            </div>

                            <div className="flex-1 space-y-1 relative">
                                <div className="absolute -top-3 right-4 z-10 bg-red-500 text-[9px] font-black text-white px-2 py-0.5 rounded-lg shadow-md border-2 border-white uppercase tracking-tighter">
                                    {calculateNights()} {calculateNights() === 1 ? 'Night' : 'Nights'}
                                </div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Check-out</label>
                                <div 
                                    className="p-3 bg-gray-50/80 rounded-2xl border border-transparent flex flex-col items-start gap-1 cursor-pointer active:scale-[0.98] transition-transform"
                                    onClick={() => checkOutRef.current?.showPicker()}
                                >
                                    <Calendar size={16} className="text-gray-400" strokeWidth={2.5} />
                                    <span className="text-sm font-black text-gray-900 tracking-tight mt-0.5">
                                        {formatDate(checkOut)}
                                    </span>
                                    <input 
                                        type="date" 
                                        ref={checkOutRef}
                                        value={checkOut}
                                        onChange={(e) => setCheckOut(e.target.value)}
                                        className="absolute inset-0 opacity-0 pointer-events-none" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Rooms & Guests */}
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Rooms & Guests</label>
                            <div 
                                onClick={() => setIsGuestSheetOpen(true)}
                                className="flex items-center justify-between p-3 bg-gray-50/80 rounded-2xl border border-transparent active:scale-[0.98] transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-white rounded-lg shadow-sm text-gray-400">
                                        <Users size={16} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-sm font-black text-gray-900 tracking-tight">
                                        {getGuestSummary()}
                                    </span>
                                </div>
                                <ChevronRight size={16} className="text-gray-400" />
                            </div>
                        </div>

                    </div>
                </motion.div>
 
                {/* Search Button Between Card and Offers */}
                <div className="mt-6 flex justify-center px-2">
                    <button 
                        onClick={() => navigate('/store/travel/hotels/list')}
                        className="w-full bg-yellow-400 text-[#001b3d] font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2.5 text-sm tracking-tight active:scale-[0.98] transition-all"
                    >
                        <Search size={20} className="stroke-[3]" />
                        <span>Search hotels</span>
                    </button>
                </div>

                {/* Offers & Banners Section */}
                <div className="mt-10 px-0.5 space-y-6">
                    {/* Flash Sale Banner */}
                    <div 
                        className="relative h-40 rounded-[28px] overflow-hidden shadow-xl group cursor-pointer active:scale-[0.98] transition-transform"
                        style={{ backgroundImage: `url('/hotel_flash_sale_1.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    >
                        <div className="absolute inset-0 bg-blue-900/20 group-hover:bg-blue-900/10 transition-colors"></div>
                        <div className="relative h-full flex flex-col justify-center px-8 text-white">
                            <h3 className="text-2xl font-[1000] leading-none drop-shadow-lg tracking-tight">Limited time only!</h3>
                            <p className="text-xs font-bold opacity-90 mt-2 flex items-center gap-1.5 underline decoration-yellow-400/50 underline-offset-4">
                                <Clock size={14} strokeWidth={3} /> Upcoming 8 - 9 PM
                            </p>
                            <p className="text-xl font-[1000] mt-3 text-yellow-300 drop-shadow-2xl italic tracking-tighter">Get Up To 65% Off</p>
                            <div className="mt-4 text-[11px] font-black bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full w-fit border border-white/20 uppercase tracking-[0.2em]">
                                Code: FKFLASH
                            </div>
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-1/3 flex items-center justify-center pr-4 overflow-hidden pointer-events-none">
                             <div className="rotate-12 opacity-20 scale-150">
                                <h4 className="text-5xl font-[1000] leading-none text-white italic tracking-tighter uppercase whitespace-nowrap">FLASH<br/>SALE</h4>
                             </div>
                        </div>
                    </div>

                    {/* Member Banner */}
                    <div 
                        className="relative h-40 rounded-[28px] overflow-hidden shadow-xl group cursor-pointer active:scale-[0.98] transition-transform"
                        style={{ backgroundImage: `url('/hotel_member_1.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent group-hover:from-black/30 transition-colors"></div>
                        <div className="relative h-full flex flex-col justify-center px-8 text-white">
                            <div className="flex items-center gap-1.5 opacity-90">
                                <p className="text-[11px] font-black uppercase tracking-[0.3em]">MARRIOTT</p>
                            </div>
                            <h3 className="text-2xl font-[1000] leading-tight flex items-center gap-2 mt-1">
                                BONV<span className="text-red-500 scale-125 font-black font-serif italic uppercase -translate-y-0.5 drop-shadow-md">OY</span>
                            </h3>
                            <p className="text-sm font-bold mt-3 leading-tight max-w-[160px]">Enroll and get <span className="block text-lg font-black text-white/100">Exclusive Benefits</span></p>
                            <button className="mt-4 text-[11px] font-black bg-white text-[#001b3d] px-6 py-2.5 rounded-xl shadow-xl hover:bg-gray-50 transition-all uppercase tracking-widest active:scale-95">
                                Become a member
                            </button>
                        </div>
                    </div>

                    {/* Must-book offers */}
                    <div className="pt-2">
                        <div className="flex items-center justify-between mb-5 px-1.5">
                            <h2 className="text-2xl font-[1000] text-gray-900 tracking-tight">Must-book offers</h2>
                        </div>
                        
                        <div className="overflow-x-auto pb-6 hide-scrollbar flex gap-5 -mx-2 px-2 snap-x snap-mandatory">
                            {/* Card 1 */}
                            <div 
                                className="min-w-[90vw] h-56 rounded-[32px] overflow-hidden relative shadow-2xl snap-start flex border border-white/20"
                                style={{ backgroundColor: '#E4F44F' }}
                            >
                                <div 
                                    className="absolute inset-0 opacity-40"
                                    style={{ backgroundImage: `url('/hotel_bank_offer_1.png')`, backgroundSize: 'cover' }}
                                ></div>
                                <div className="relative flex-1 p-6 flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-[1000] text-gray-900 leading-tight">Flipkart Axis Bank offer</h3>
                                        <h4 className="text-2xl font-[1000] text-gray-900 leading-none">Flat 25% Off</h4>
                                        <p className="text-[11px] font-bold text-gray-600 mt-1">on Credit Card Trxns.</p>
                                    </div>
                                    <div className="text-[10px] font-black bg-white border border-gray-200 px-3 py-1.5 rounded-lg w-fit text-gray-900 uppercase tracking-widest shadow-sm">
                                        Code: AXISCASHBACK
                                    </div>
                                </div>
                                <div className="relative w-1/3 bg-black/5 flex items-center justify-center p-4">
                                    <div className="w-full aspect-[1.6/1] bg-gradient-to-br from-gray-800 to-black rounded-lg shadow-xl relative overflow-hidden flex flex-col justify-between p-2 text-white">
                                        <div className="flex justify-between items-start">
                                            <div className="w-6 h-4 bg-yellow-500/50 rounded-sm"></div>
                                            <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                        </div>
                                        <div className="text-[6px] font-[1000] opacity-80 tracking-widest uppercase truncate">AXIS BANK</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trust Badges Scroll */}
                <div className="flex gap-4 overflow-x-auto pt-10 pb-8 -mx-2 px-2 scrollbar-hide">
                    {[
                        { icon: ShieldCheck, text: 'Safe Stays', desc: 'Hygiene Assured' },
                        { icon: Zap, text: 'Instant Confirm', desc: 'No Wait Time' },
                        { icon: Star, text: 'Top Rated', desc: 'Verified User Stays' },
                    ].map((badge, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-neutral-100 shadow-sm min-w-[170px]">
                            <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                                <badge.icon size={18} />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-gray-900">{badge.text}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{badge.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Deal Grid Header */}
                <div className="flex items-center justify-between mb-6 px-2 mt-12">
                    <div>
                        <h3 className="text-2xl font-[1000] text-gray-900 tracking-tight">Crazy Hour Deals</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Exclusive App-only offers</p>
                    </div>
                    <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full border border-red-100/50">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Live Now</span>
                    </div>
                </div>

                {/* Deal Grid */}
                <div className="grid grid-cols-2 gap-4 mb-12 px-2">
                    {[
                        { name: 'Azure Bay Resort', location: 'Maldives', img: '/hotel_deal_1.png', price: '₹12,499', rating: '4.9', locked: false, label: 'Bestseller' },
                        { name: 'Mountain Peak', location: 'Manali', img: '/hotel_deal_2.png', price: '₹4,200', rating: '4.7', locked: true, label: 'Locked' },
                    ].map((deal, idx) => (
                        <motion.div 
                            key={idx}
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-white rounded-[28px] overflow-hidden shadow-sm border border-neutral-100 group"
                        >
                            <div className="relative aspect-[4/5] bg-gray-100">
                                <img src={deal.img} alt={deal.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                {deal.locked ? (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center p-4">
                                        <div className="bg-white/20 p-3 rounded-full border border-white/30 mb-2">
                                            <Lock size={24} className="text-white" fill="currentColor" />
                                        </div>
                                        <p className="text-[10px] font-black text-white uppercase text-center tracking-tighter">Unlocks at 8 PM</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="absolute top-3 left-3 bg-white rounded-lg px-2 py-1 flex items-center gap-1 shadow-md border border-gray-100">
                                            <Star size={10} fill="#ffc107" className="text-[#ffc107]" />
                                            <span className="text-[11px] font-black text-gray-900">{deal.rating}</span>
                                        </div>
                                        <button className="absolute top-3 right-3 bg-black/20 hover:bg-red-500/80 backdrop-blur-md text-white p-2 rounded-full transition-colors">
                                            <Heart size={16} />
                                        </button>
                                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                            <span className="bg-yellow-400 text-gray-900 text-[9px] font-[1000] uppercase px-3 py-1 rounded-lg tracking-tighter shadow-lg shadow-yellow-400/20">{deal.label}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="p-4">
                                <h4 className="text-sm font-black text-gray-900 truncate leading-none">{deal.name}</h4>
                                <div className="flex items-center gap-1 text-gray-400 mt-1.5 mb-3">
                                    <MapPin size={10} />
                                    <span className="text-[10px] font-bold uppercase">{deal.location}</span>
                                </div>
                                {!deal.locked && (
                                    <div className="flex items-end justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-base font-black text-gray-900">{deal.price}</span>
                                            <span className="text-[8px] font-bold text-gray-400 uppercase">per night</span>
                                        </div>
                                        <div className="bg-gray-100 h-8 w-8 rounded-full flex items-center justify-center text-gray-900 font-black text-sm">
                                            →
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Exclusive Membership Banner */}
                <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-[32px] p-6 text-white mb-10 shadow-2xl relative overflow-hidden border border-white/5 mx-2">
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="bg-gradient-to-tr from-yellow-400 to-yellow-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20 rotate-12 shrink-0">
                            <Star size={24} fill="currentColor" color="currentColor" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black tracking-tight leading-none mb-1">VIP Stays Access</h4>
                            <p className="text-gray-400 text-[11px] font-bold">Priority support & free upgrades on every LaxMart booking.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotelBooking;
