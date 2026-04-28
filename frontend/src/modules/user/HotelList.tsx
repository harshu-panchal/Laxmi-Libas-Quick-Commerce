import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, 
    Search, 
    MapPin, 
    Calendar, 
    X, 
    Star, 
    ChevronDown, 
    SlidersHorizontal, 
    Map as MapIcon, 
    IndianRupee 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getHotels } from '../../services/api/customerHotelService';
import { useLocation } from '../../hooks/useLocation';
import GenericLocationAutocomplete from '../../components/GenericLocationAutocomplete';

const HotelList: React.FC = () => {
    const navigate = useNavigate();
    const [fetchedHotels, setFetchedHotels] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showEditOverlay, setShowEditOverlay] = React.useState(false);
    const [showSortOverlay, setShowSortOverlay] = React.useState(false);
    const [showPriceOverlay, setShowPriceOverlay] = React.useState(false);
    const [showReviewsOverlay, setShowReviewsOverlay] = React.useState(false);
    const [isUpdating, setIsUpdating] = React.useState(false);
    const [sortBy, setSortBy] = React.useState('Popularity');
    const [selectedPriceRange, setSelectedPriceRange] = React.useState('Any Price');
    const [minReviewScore, setMinReviewScore] = React.useState(0);
    const checkInRef = React.useRef<HTMLInputElement>(null);
    const checkOutRef = React.useRef<HTMLInputElement>(null);

    const { location: userLocation } = useLocation();

    // Search States
    const [destination, setDestination] = React.useState(userLocation?.city || '');
    const [dates, setDates] = React.useState({
        checkIn: new Date().toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    });
    const [guestConfig, setGuestConfig] = React.useState([{ adults: 2, children: 0 }]);

    const fetchHotelsList = async () => {
        setLoading(true);
        try {
            const queryParams: any = {};
            
            if (destination && destination.trim() !== '') {
                queryParams.city = destination.trim();
            }

            if (userLocation?.latitude && userLocation?.longitude) {
                queryParams.latitude = userLocation.latitude;
                queryParams.longitude = userLocation.longitude;
            }

            const response = await getHotels(queryParams);
            if (response.success) {
                setFetchedHotels(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch hotels:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchHotelsList();
    }, []);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    };

    const getGuestSummary = () => {
        const totalRooms = guestConfig.length;
        const totalAdults = guestConfig.reduce((acc, r) => acc + r.adults, 0);
        return `${totalRooms.toString().padStart(2, '0')} Room${totalRooms > 1 ? 's' : ''}, ${totalAdults.toString().padStart(2, '0')} Adult${totalAdults > 1 ? 's' : ''}`;
    };

    const updateGuestCount = (roomIdx: number, type: 'adults' | 'children', delta: number) => {
        setGuestConfig(prev => prev.map((room, idx) => {
            if (idx === roomIdx) {
                const newVal = room[type] + delta;
                if (type === 'adults' && newVal < 1) return room;
                if (type === 'children' && newVal < 0) return room;
                return { ...room, [type]: newVal };
            }
            return room;
        }));
    };

    const addRoom = () => setGuestConfig(prev => [...prev, { adults: 1, children: 0 }]);

    const handleUpdateSearch = () => {
        setIsUpdating(true);
        setShowEditOverlay(false);
        setShowSortOverlay(false);
        setShowPriceOverlay(false);
        setShowReviewsOverlay(false);
        fetchHotelsList().then(() => {
            setTimeout(() => setIsUpdating(false), 800);
        });
    };

    const handleSortChange = (option: string) => {
        setSortBy(option);
        handleUpdateSearch();
    };

    const handlePriceChange = (option: string) => {
        setSelectedPriceRange(option);
        handleUpdateSearch();
    };

    const handleReviewChange = (score: number) => {
        setMinReviewScore(score);
        handleUpdateSearch();
    };

    const filters = [
        { name: 'Map', icon: MapIcon },
        { name: 'Sort by', icon: SlidersHorizontal, hasDropdown: true },
        { name: 'Price', icon: IndianRupee, hasDropdown: true },
        { name: 'Reviews', icon: Star, hasDropdown: true }
    ];


    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col font-['Inter'] selection:bg-blue-100">
            {/* Header */}
            <header className="bg-white sticky top-0 z-50 border-b border-gray-100 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-800" />
                    </button>
                    
                    <button 
                        onClick={() => setShowEditOverlay(true)}
                        className="flex-1 bg-gray-50/80 rounded-full py-2 px-4 flex items-center justify-between border border-gray-100 active:scale-95 transition-transform"
                    >
                        <div className="flex flex-col text-left">
                            <h1 className="text-sm font-black text-gray-900 leading-tight">{destination}</h1>
                            <p className="text-[10px] font-bold text-gray-500 whitespace-nowrap">
                                {formatDate(dates.checkIn)} - {formatDate(dates.checkOut)} · {getGuestSummary()}
                            </p>
                        </div>
                        <Search size={16} className="text-gray-400" />
                    </button>
                </div>
            </header>

            {/* Edit Search Overlay */}
            <AnimatePresence>
                {showEditOverlay && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end"
                        onClick={() => setShowEditOverlay(false)}
                    >
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full bg-white rounded-t-[32px] px-6 pt-6 pb-8"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Edit Search</h2>
                                <button 
                                    onClick={() => setShowEditOverlay(false)}
                                    className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 hide-scrollbar">
                                {/* Destination */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Destination</label>
                                    <div className="relative group">
                                        <GenericLocationAutocomplete 
                                            value={destination}
                                            onSelect={(data) => setDestination(data.city || data.placeName || '')}
                                            placeholder="Where to?"
                                            hideFindButton={true}
                                        />
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5 relative">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Check-in</label>
                                        <div 
                                            onClick={() => checkInRef.current?.showPicker()}
                                            className="flex items-center gap-2.5 p-4 bg-gray-50 rounded-2xl border border-transparent cursor-pointer hover:bg-white hover:border-blue-100 transition-all shadow-sm"
                                        >
                                            <Calendar size={18} className="text-blue-600" />
                                            <span className="text-[13px] font-black text-gray-900">{formatDate(dates.checkIn)}</span>
                                            <input 
                                                type="date" 
                                                ref={checkInRef}
                                                value={dates.checkIn}
                                                onChange={(e) => setDates(prev => ({ ...prev, checkIn: e.target.value }))}
                                                className="absolute inset-0 opacity-0 pointer-events-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 relative">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Check-out</label>
                                        <div 
                                            onClick={() => checkOutRef.current?.showPicker()}
                                            className="flex items-center gap-2.5 p-4 bg-gray-50 rounded-2xl border border-transparent cursor-pointer hover:bg-white hover:border-blue-100 transition-all shadow-sm"
                                        >
                                            <Calendar size={18} className="text-blue-600" />
                                            <span className="text-[13px] font-black text-gray-900">{formatDate(dates.checkOut)}</span>
                                            <input 
                                                type="date" 
                                                ref={checkOutRef}
                                                value={dates.checkOut}
                                                onChange={(e) => setDates(prev => ({ ...prev, checkOut: e.target.value }))}
                                                className="absolute inset-0 opacity-0 pointer-events-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Rooms & Guests */}
                                <div className="space-y-3 pb-2">
                                    <div className="flex items-center justify-between pl-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Guests & Rooms</label>
                                        <button 
                                            onClick={addRoom}
                                            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                        >
                                            + Add Room
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {guestConfig.map((room, idx) => (
                                            <div key={idx} className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-gray-900 uppercase tracking-wider">Room {idx + 1}</span>
                                                    {guestConfig.length > 1 && (
                                                        <button 
                                                            onClick={() => setGuestConfig(prev => prev.filter((_, i) => i !== idx))}
                                                            className="text-[10px] font-bold text-red-500 uppercase"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">Adults</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase">12+ Years</p>
                                                    </div>
                                                    <div className="flex items-center gap-4 bg-white p-1 rounded-full border border-gray-100">
                                                        <button 
                                                            onClick={() => updateGuestCount(idx, 'adults', -1)}
                                                            className="w-8 h-8 rounded-full border border-gray-200 text-gray-600 flex items-center justify-center disabled:opacity-20 transition-all font-bold"
                                                            disabled={room.adults <= 1}
                                                        >
                                                            −
                                                        </button>
                                                        <span className="text-sm font-black text-gray-900 w-4 text-center">{room.adults}</span>
                                                        <button 
                                                            onClick={() => updateGuestCount(idx, 'adults', 1)}
                                                            className="w-8 h-8 rounded-full border border-blue-100 text-blue-600 flex items-center justify-center transition-all font-bold"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">Children</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase">2-12 Years</p>
                                                    </div>
                                                    <div className="flex items-center gap-4 bg-white p-1 rounded-full border border-gray-100">
                                                        <button 
                                                            onClick={() => updateGuestCount(idx, 'children', -1)}
                                                            className="w-8 h-8 rounded-full border border-gray-200 text-gray-600 flex items-center justify-center disabled:opacity-20 transition-all font-bold"
                                                            disabled={room.children <= 0}
                                                        >
                                                            −
                                                        </button>
                                                        <span className="text-sm font-black text-gray-900 w-4 text-center">{room.children}</span>
                                                        <button 
                                                            onClick={() => updateGuestCount(idx, 'children', 1)}
                                                            className="w-8 h-8 rounded-full border border-blue-100 text-blue-600 flex items-center justify-center transition-all font-bold"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleUpdateSearch}
                                className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl mt-8 text-base uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                Update Search
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sort By Overlay */}
            <AnimatePresence>
                {showSortOverlay && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end"
                        onClick={() => setShowSortOverlay(false)}
                    >
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full bg-white rounded-t-[32px] px-6 pt-6 pb-8"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Sort By</h2>
                                <button 
                                    onClick={() => setShowSortOverlay(false)}
                                    className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-1">
                                {[
                                    'Popularity',
                                    'User rating: High to Low',
                                    'Price: High to Low',
                                    'Price: Low to High'
                                ].map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => handleSortChange(option)}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all group"
                                    >
                                        <span className={`text-base font-bold tracking-tight ${sortBy === option ? 'text-blue-600 font-black' : 'text-gray-700'}`}>
                                            {option}
                                        </span>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                            sortBy === option 
                                            ? 'border-blue-600 bg-blue-600' 
                                            : 'border-gray-200 group-hover:border-gray-300'
                                        }`}>
                                            {sortBy === option && <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Price Overlay */}
            <AnimatePresence>
                {showPriceOverlay && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end"
                        onClick={() => setShowPriceOverlay(false)}
                    >
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full bg-white rounded-t-[32px] px-6 pt-6 pb-8"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Price Range</h2>
                                <button 
                                    onClick={() => setShowPriceOverlay(false)}
                                    className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-1">
                                {[
                                    'Any Price',
                                    'Up to ₹2,000',
                                    '₹2,000 - ₹5,000',
                                    '₹5,000 - ₹10,000',
                                    '₹10,000+'
                                ].map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => handlePriceChange(option)}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all group"
                                    >
                                        <span className={`text-base font-bold tracking-tight ${selectedPriceRange === option ? 'text-blue-600 font-black' : 'text-gray-700'}`}>
                                            {option}
                                        </span>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                            selectedPriceRange === option 
                                            ? 'border-blue-600 bg-blue-600' 
                                            : 'border-gray-200 group-hover:border-gray-300'
                                        }`}>
                                            {selectedPriceRange === option && <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reviews Overlay */}
            <AnimatePresence>
                {showReviewsOverlay && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end"
                        onClick={() => setShowReviewsOverlay(false)}
                    >
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full bg-white rounded-t-[32px] px-6 pt-6 pb-8"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Review Score</h2>
                                <button 
                                    onClick={() => setShowReviewsOverlay(false)}
                                    className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-1">
                                {[
                                    { label: 'Any Score', value: 0 },
                                    { label: '4.5+ Excellent', value: 4.5 },
                                    { label: '4.0+ Very Good', value: 4 },
                                    { label: '3.5+ Good', value: 3.5 }
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleReviewChange(option.value)}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all group"
                                    >
                                        <div className="flex flex-col items-start">
                                            <span className={`text-base font-bold tracking-tight ${minReviewScore === option.value ? 'text-blue-600 font-black' : 'text-gray-700'}`}>
                                                {option.label}
                                            </span>
                                            {option.value > 0 && (
                                                <div className="flex gap-0.5 mt-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={10} fill={i < Math.floor(option.value) ? "#2563eb" : "#e5e7eb"} className={i < Math.floor(option.value) ? "text-blue-600" : "text-gray-200"} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                            minReviewScore === option.value 
                                            ? 'border-blue-600 bg-blue-600' 
                                            : 'border-gray-200 group-hover:border-gray-300'
                                        }`}>
                                            {minReviewScore === option.value && <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading/Updating State */}
            <AnimatePresence>
                {isUpdating && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-white/80 backdrop-blur-md z-[150] flex flex-col items-center justify-center"
                    >
                        <motion.div 
                            animate={{ 
                                scale: [1, 1.1, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="w-16 h-16 bg-blue-600 rounded-3xl shadow-xl shadow-blue-200 flex items-center justify-center mb-6"
                        >
                            <Search size={32} className="text-white" strokeWidth={3} />
                        </motion.div>
                        <p className="text-sm font-black text-gray-900 uppercase tracking-widest px-8 py-2 bg-gray-100 rounded-full">
                            Searching in {destination}...
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white px-4 py-3 flex gap-2.5 overflow-x-auto scrollbar-hide sticky top-[65px] z-40">
                {filters.map((filter, idx) => {
                    const isActive = 
                        (filter.name === 'Sort by' && sortBy !== 'Popularity') ||
                        (filter.name === 'Price' && selectedPriceRange !== 'Any Price') ||
                        (filter.name === 'Reviews' && minReviewScore !== 0);

                    const label = 
                        filter.name === 'Sort by' ? (sortBy === 'Popularity' ? 'Sort by' : sortBy) :
                        filter.name === 'Price' ? (selectedPriceRange === 'Any Price' ? 'Price' : selectedPriceRange) :
                        filter.name === 'Reviews' ? (minReviewScore === 0 ? 'Reviews' : `${minReviewScore}+ Score`) :
                        filter.name;

                    const handleClick = () => {
                        if (filter.name === 'Sort by') setShowSortOverlay(true);
                        else if (filter.name === 'Price') setShowPriceOverlay(true);
                        else if (filter.name === 'Reviews') setShowReviewsOverlay(true);
                    };

                    return (
                        <button 
                            key={idx}
                            onClick={handleClick}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-full whitespace-nowrap text-sm font-bold transition-all active:scale-95 shadow-sm ${
                                isActive 
                                ? 'bg-blue-600 border-blue-600 text-white' 
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {filter.icon && <filter.icon size={16} className={isActive ? 'text-white' : 'text-blue-600'} />}
                            {label}
                            {filter.hasDropdown && <ChevronDown size={14} className={isActive ? 'text-white' : 'text-gray-400'} />}
                        </button>
                    );
                })}
            </div>

            {/* Main Content */}
            <main className="flex-1 p-4 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-sm font-bold text-gray-500">Finding best hotels for you...</p>
                    </div>
                ) : fetchedHotels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                            <MapPin size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-1">No Hotels Found</h3>
                        <p className="text-sm text-gray-500 font-bold mb-6">We couldn't find any approved hotels in {destination} for the selected dates.</p>
                        <button 
                            onClick={() => setShowEditOverlay(true)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest"
                        >
                            Change Location
                        </button>
                    </div>
                ) : fetchedHotels.map((hotel) => {
                    // Mapping backend fields to UI fields
                    const hotelId = hotel._id;
                    const rating = hotel.rating || 0;
                    const reviewsCount = hotel.reviewsCount || 0;
                    const price = hotel.basePrice || 0;
                    const originalPrice = hotel.originalPrice || price; // Use actual original price if available
                    const stars = hotel.stars || 3;
                    const ratingText = rating >= 4.5 ? 'Excellent' : rating >= 4 ? 'Very Good' : rating > 0 ? 'Good' : 'New';
                    const mainImg = hotel.mainImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945';
                    const amenities = hotel.amenities || [];
                    const offers = [
                      ...(hotel.policies?.coupleFriendly ? ['Couple Friendly'] : []),
                      'Laxmart Verified'
                    ];

                    const hasDiscount = originalPrice > price;
                    const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

                    return (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={hotelId}
                            onClick={() => navigate(`/store/travel/hotels/detail/${hotelId}`)}
                            className="bg-white rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative group cursor-pointer active:scale-[0.98] transition-all"
                        >
                            {/* Image Section */}
                            <div className="relative aspect-[1.8/1] bg-gray-100">
                                <img src={mainImg} alt={hotel.name} className="w-full h-full object-cover" />
                                
                                {/* Member Choice Badge */}
                                {hotel.isMemberChoice && (
                                    <div className="absolute top-3 left-3 bg-yellow-400 text-gray-900 text-[8px] font-black px-2 py-1 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-widest border border-yellow-200">
                                        <Star size={10} fill="currentColor" />
                                        Choice
                                    </div>
                                )}

                                {/* Urgency Tag */}
                                {hotel.details?.roomsLeft <= 3 && (
                                    <div className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg uppercase tracking-tighter">
                                        {hotel.details.roomsLeft} left
                                    </div>
                                )}
                            </div>

                            {/* Content Section */}
                            <div className="p-3">
                                <div className="flex items-start justify-between mb-1">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            {rating > 0 && (
                                                <div className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                                                    {rating}
                                                </div>
                                            )}
                                            <span className="text-blue-600 font-black text-[10px] uppercase tracking-tight">{ratingText}</span>
                                            {reviewsCount > 0 && (
                                                <span className="text-gray-400 text-[9px] font-bold">({reviewsCount})</span>
                                            )}
                                        </div>
                                        <h2 className="text-sm font-black text-gray-900 leading-tight mb-0.5 truncate">{hotel.name}</h2>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex items-center gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={8} fill={i < stars ? "#ffc107" : "#e5e7eb"} className={i < stars ? "text-[#ffc107]" : "text-gray-200"} />
                                                ))}
                                            </div>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{hotel.city}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Amenities Chips row */}
                                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide mb-4">
                                    {amenities.slice(0, 4).map((amenity: string, idx: number) => (
                                        <span key={idx} className="bg-gray-50 text-gray-500 text-[9px] font-black px-2.5 py-1 rounded-md border border-gray-100/50 uppercase tracking-tight whitespace-nowrap">
                                            {amenity}
                                        </span>
                                    ))}
                                </div>

                                {/* Offers Strip */}
                                <div className="space-y-2 mb-5">
                                    {offers.map((offer: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 text-green-600">
                                            <div className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center">
                                                <span className="text-[10px] font-black italic">✓</span>
                                            </div>
                                            <span className="text-xs font-black">{offer}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Pricing Section */}
                                <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-black text-gray-900">₹{price.toLocaleString()}</span>
                                            {hasDiscount && (
                                                <span className="text-[10px] font-bold text-gray-400 line-through">₹{originalPrice.toLocaleString()}</span>
                                            )}
                                        </div>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                                            + ₹{(hotel.taxes || 0).toLocaleString()} taxes / night
                                        </p>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/store/travel/hotels/detail/${hotelId}`);
                                        }}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-sm shadow-blue-100"
                                    >
                                        Select
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

            </main>
        </div>
    );
};

export default HotelList;
