import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Info, Wine, Wifi, Power, Tv, ShieldCheck, ChevronRight, X, Contact2, Navigation, Loader2 } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

interface Seat {
    id: string;
    type: 'seater' | 'sleeper';
    status: 'available' | 'booked' | 'female-booked' | 'male-booked' | 'selected';
    price: number;
    gender?: 'male' | 'female';
}

interface Point {
    id: string;
    name: string;
    sub: string;
    time: string;
    date: string;
}

const BusSeatSelection: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    
    // Mock data from previous page
    const operator = "Hans Travels (I) Pvt Ltd.";
    const timing = "08:00 PM, Wed 08 Apr";
    const basePrice = 815;

    const [activeTab, setActiveTab] = useState('Seat');
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [bookingStep, setBookingStep] = useState<'seats' | 'pickup' | 'dropoff' | 'passengers' | 'review' | 'payment'>('seats');
    const [selectedPickup, setSelectedPickup] = useState<string | null>(null);
    const [selectedDropoff, setSelectedDropoff] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [passengers, setPassengers] = useState<Record<string, { firstName: string, lastName: string, age: string, gender: string }>>({});
    const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [redirectApp, setRedirectApp] = useState('');

    const handlePaymentAction = () => {
        if (!selectedPayment) return;
        
        const appName = selectedPayment === 'gpay' ? 'Google Pay' : 
                        selectedPayment === 'phonepe' ? 'PhonePe' : 
                        selectedPayment === 'paytm' ? 'Paytm' : 'your bank';
                        
        setRedirectApp(appName);
        setIsRedirecting(true);
        
        setTimeout(() => {
            setIsRedirecting(false);
            navigate(`/store/travel/confirmation?type=bus&operator=${encodeURIComponent(operator)}&from=Mumbai&to=Pune&seats=${selectedSeats.join(',')}&total=${totalPrice}`);
        }, 2500);
    };

    const handlePassengerChange = (seatId: string, field: string, value: string) => {
        setPassengers(prev => ({
            ...prev,
            [seatId]: {
                ...(prev[seatId] || { firstName: '', lastName: '', age: '', gender: 'Male' }),
                [field]: value
            }
        }));
    };

    // Mock pick-up points
    const pickupPoints: Point[] = [
        { id: 'p1', name: "Hans Travels, Balaji Building Neema Heart Hospital Ke Samne Indian Petrol Pump Dindayal Chowk", sub: "Hans Travels, Balaji Building Neema Had Hospital Ke Samne Indian Petrol Pump Dindayal Chowk", time: "08:00 PM", date: "08 Apr, 2026" },
        { id: 'p2', name: "Interstate Bus Terminal (ISBT)", sub: "Platform No. 4, Main Terminal Area", time: "08:30 PM", date: "08 Apr, 2026" },
        { id: 'p3', name: "Vijay Nagar Square", sub: "Near Orbit Mall, Main Road", time: "09:00 PM", date: "08 Apr, 2026" },
        { id: 'p4', name: "Rajwada Palace Gate", sub: "Heritage Area, City Center", time: "09:15 PM", date: "08 Apr, 2026" }
    ];

    // Mock drop-off points
    const dropoffPoints: Point[] = [
        { id: 'd1', name: "Dhaula Kuan Bus Stop", sub: "Main Road, Delhi", time: "06:00 AM", date: "09 Apr, 2026" },
        { id: 'd2', name: "Kashmiri Gate ISBT", sub: "Arrival Platform, New Delhi", time: "06:45 AM", date: "09 Apr, 2026" },
        { id: 'd3', name: "Sarai Kale Khan", sub: "Main Entrance, New Delhi", time: "07:15 AM", date: "09 Apr, 2026" },
        { id: 'd4', name: "Maharana Pratap ISBT", sub: "Arrival Terminal, Delhi", time: "07:30 AM", date: "09 Apr, 2026" }
    ];

    const currentList = bookingStep === 'pickup' ? pickupPoints : dropoffPoints;

    const filteredPoints = currentList.filter(point => 
        point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        point.sub.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Mock seat grid (Lower Deck)
    const [lowerDeck, setLowerDeck] = useState<Seat[]>(
        Array.from({ length: 15 }, (_, i) => ({
            id: `L${i + 1}`,
            type: i % 5 === 0 ? 'sleeper' : 'seater',
            status: i === 3 ? 'female-booked' : i === 7 ? 'male-booked' : i === 12 ? 'booked' : 'available',
            price: basePrice + (i % 2 === 0 ? 50 : 0)
        }))
    );

    const toggleSeat = (seatId: string) => {
        const seat = lowerDeck.find(s => s.id === seatId);
        if (!seat || seat.status.includes('booked')) return;

        setSelectedSeats(prev => {
            const isSelected = prev.includes(seatId);
            if (isSelected) {
                const { [seatId]: removed, ...rest } = passengers;
                setPassengers(rest);
                return prev.filter(id => id !== seatId);
            }
            return [...prev, seatId];
        });
    };

    const baseFare = selectedSeats.reduce((sum, id) => {
        const seat = lowerDeck.find(s => s.id === id);
        return sum + (seat?.price || 0);
    }, 0);

    const tax = Math.round(baseFare * 0.05); // 5% tax mock
    const convenienceFee = 10;
    const totalPrice = baseFare + tax + convenienceFee;

    const tabs = ['Seat', 'Amenities', 'Policies', 'Ratings'];

    const getSeatColor = (status: string, isSeater: boolean) => {
        if (selectedSeats.includes(status)) return 'bg-blue-600 border-blue-600 shadow-blue-100';
        switch (status) {
            case 'available': return 'bg-white border-gray-300';
            case 'booked': return 'bg-gray-100 border-transparent';
            case 'female-booked': return 'bg-pink-100 border-transparent';
            case 'male-booked': return 'bg-blue-100 border-transparent';
            default: return 'bg-white border-gray-300';
        }
    };

    const selectedPickupPoint = pickupPoints.find(p => p.id === selectedPickup);
    const selectedDropoffPoint = dropoffPoints.find(p => p.id === selectedDropoff);

    return (
        <div className="min-h-screen bg-white font-['Inter'] flex flex-col">
            {/* Header */}
            <header className="px-4 py-4 flex items-center gap-4 bg-white border-b border-gray-50">
                <button 
                    onClick={() => {
                        if (bookingStep === 'seats') navigate(-1);
                        else if (bookingStep === 'pickup') setBookingStep('seats');
                        else if (bookingStep === 'dropoff') setBookingStep('pickup');
                        else if (bookingStep === 'passengers') setBookingStep('dropoff');
                        else setBookingStep('passengers');
                    }} 
                    className="p-1 active:scale-90 transition-transform"
                >
                    <ArrowLeft size={24} className="text-gray-900" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 leading-none">
                        {bookingStep === 'seats' ? operator : 
                         bookingStep === 'passengers' ? 'Traveller details' :
                         bookingStep === 'review' ? 'Review booking' :
                         bookingStep === 'payment' ? 'Payments' :
                         `Choose ${bookingStep}-up point`.replace('drop-up', 'drop-off')}
                    </h1>
                    {bookingStep === 'seats' && (
                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-tighter">{timing}</p>
                    )}
                </div>
            </header>

            {/* Step Selection UI */}
            {bookingStep === 'seats' ? (
                <>
                    {/* Tabs */}
                    <div className="flex px-4 border-b border-gray-100 sticky top-0 bg-white z-50">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest relative transition-all ${activeTab === tab ? 'text-blue-600' : 'text-gray-400'}`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <motion.div 
                                        layoutId="activeTabUnderline"
                                        className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    <main className="flex-1 overflow-y-auto bg-[#fafafa] pb-[120px]">
                        {activeTab === 'Seat' && (
                            <div className="p-4 flex gap-4">
                                {/* Seat Info Legend */}
                                <div className="w-[140px] flex-shrink-0 bg-white rounded-3xl border border-gray-100 p-4 h-fit shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-black text-gray-900">Seat info</h3>
                                        <Info size={14} className="text-gray-400" />
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Seater', style: 'w-6 h-6 border-2 border-gray-300 rounded-md' },
                                            { label: 'Sleeper', style: 'w-6 h-10 border-2 border-gray-300 rounded-lg' },
                                            { label: 'Available (F)', style: 'w-6 h-6 border-2 border-pink-200 rounded-md bg-white' },
                                            { label: 'Booked (F)', style: 'w-6 h-6 bg-pink-500 rounded-md flex items-center justify-center', inner: 'X' },
                                            { label: 'Available (M)', style: 'w-6 h-6 border-2 border-blue-200 rounded-md bg-white' },
                                            { label: 'Booked (M)', style: 'w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center', inner: 'X' },
                                            { label: 'Booked', style: 'w-6 h-6 bg-gray-200 rounded-md flex items-center justify-center', inner: 'X' },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter leading-tight">{item.label}</span>
                                                    <div className={item.style}>
                                                        {item.inner && <span className="text-[8px] text-white font-black">{item.inner}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Deck Layout */}
                                <div className="flex-1 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-base font-black text-gray-900">Lower deck</h3>
                                        <div className="p-2 bg-gray-50 rounded-full text-gray-400">
                                            <Navigation size={18} className="rotate-45" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 justify-items-center relative">
                                        {/* Steering Column Decor */}
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-full border-x border-gray-50/50"></div>
                                        
                                        {lowerDeck.map((seat) => {
                                            const isSelected = selectedSeats.includes(seat.id);
                                            const isBooked = seat.status.includes('booked');
                                            
                                            return (
                                                <motion.div
                                                    key={seat.id}
                                                    whileTap={!isBooked ? { scale: 0.9 } : {}}
                                                    onClick={() => toggleSeat(seat.id)}
                                                    className={`
                                                        relative cursor-pointer transition-all border-2
                                                        ${seat.type === 'sleeper' ? 'w-14 h-24' : 'w-12 h-12'}
                                                        ${isSelected 
                                                            ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-100 scale-105 z-10' 
                                                            : isBooked 
                                                                ? 'bg-gray-100 border-transparent grayscale' 
                                                                : seat.status === 'female-booked' 
                                                                    ? 'bg-pink-50 border-pink-100' 
                                                                    : 'bg-white border-gray-100 hover:border-blue-200'
                                                        }
                                                        rounded-[14px] flex items-center justify-center text-center
                                                    `}
                                                >
                                                    <div className="flex flex-col items-center">
                                                        {isSelected ? (
                                                            <ShieldCheck size={18} className="text-white" />
                                                        ) : isBooked ? (
                                                            <X size={14} className="text-gray-300" strokeWidth={3} />
                                                        ) : (
                                                            <span className={`text-[10px] font-black ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                                                ₹{seat.price}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Decorative Pillows for Sleeper */}
                                                    {seat.type === 'sleeper' && (
                                                        <div className={`absolute top-1.5 left-1.5 right-1.5 h-3 rounded-md mb-1 ${isSelected ? 'bg-white/20' : 'bg-gray-50'}`}></div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {/* Driver decorative seat */}
                                    <div className="absolute top-6 right-6 opacity-20 rotate-[135deg]">
                                        <Navigation size={32} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </>
            ) : bookingStep === 'passengers' ? (
                <main className="flex-1 bg-white overflow-y-auto p-4 space-y-6 pb-[140px]">
                    {/* Info Banner */}
                    <div className="bg-[#fff9c4]/50 rounded-lg p-4 border border-[#fff59d]/50">
                        <p className="text-[11px] font-bold text-gray-900 leading-normal">
                            <span className="font-black">PLEASE NOTE:</span> Traveller name should be same as on Government ID proof
                        </p>
                    </div>

                    {selectedSeats.map((seatId, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={seatId} 
                            className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6"
                        >
                            <div className="flex gap-4 items-center">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                                        PASSENGER {idx + 1}
                                    </h3>
                                    <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest">
                                        SEAT {seatId}
                                    </p>
                                </div>
                            </div>

                            {/* Gender Selection */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">GENDER</label>
                                <div className="flex gap-4">
                                    {['MALE', 'FEMALE'].map((g) => (
                                        <button
                                            key={g}
                                            onClick={() => handlePassengerChange(seatId, 'gender', g)}
                                            className={`
                                                flex-1 py-3.5 rounded-xl border text-sm font-black transition-all
                                                ${(passengers[seatId]?.gender?.toUpperCase() || 'MALE') === g 
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                                                    : 'bg-white border-gray-100 text-gray-300 hover:border-gray-200'}
                                            `}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Name Inputs */}
                            <div className="grid grid-cols-[2fr_1fr] gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">FULL NAME</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter name"
                                        value={passengers[seatId]?.firstName || ''}
                                        onChange={(e) => handlePassengerChange(seatId, 'firstName', e.target.value)}
                                        className="w-full bg-white border border-gray-100 rounded-xl px-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-blue-400 transition-all placeholder:text-gray-300"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">AGE</label>
                                    <input 
                                        type="number" 
                                        placeholder="Ex: 25"
                                        value={passengers[seatId]?.age || ''}
                                        onChange={(e) => handlePassengerChange(seatId, 'age', e.target.value)}
                                        className={`w-full bg-white border ${!passengers[seatId]?.age ? 'border-red-100' : 'border-gray-100'} rounded-xl px-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-blue-400 transition-all placeholder:text-gray-300`}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    <hr className="border-gray-50 border-t-2" />

                    {/* Contact Details */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6 pb-20">
                        <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                <Info size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                                    CONTACT DETAILS
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Updates will be sent here</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex gap-0 border border-gray-100 rounded-xl overflow-hidden focus-within:border-blue-400 transition-all">
                                <div className="bg-gray-50/50 px-4 py-4 border-r border-gray-100 text-sm font-black text-gray-900 flex items-center">
                                    +91
                                </div>
                                <input 
                                    type="tel" 
                                    placeholder="Enter mobile number"
                                    defaultValue="8770620342"
                                    className="flex-1 px-4 py-4 text-sm font-bold text-gray-900 focus:outline-none placeholder:text-gray-300"
                                />
                            </div>

                            <input 
                                type="email" 
                                placeholder="Enter email address"
                                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-blue-400 transition-all placeholder:text-gray-300"
                            />
                        </div>
                    </div>
                </main>
            ) : bookingStep === 'review' ? (
                <main className="flex-1 bg-[#f8f9fa] overflow-y-auto pb-[160px]">
                    <div className="p-4 space-y-4">
                        {/* Bus Operator Card */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                            <div className="bg-[#212121] p-4 flex gap-4 items-center">
                                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white">
                                    <Wine size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white">{operator}</h3>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">A/C, Sleeper, Deluxe</p>
                                </div>
                            </div>
                            
                            <div className="p-5 space-y-6">
                                <div className="flex justify-between items-center relative">
                                    <div className="text-left space-y-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Jabalpur</p>
                                        <p className="text-xl font-black text-gray-900 tabular-nums">08:00 PM</p>
                                        <p className="text-[11px] font-bold text-gray-500">Wed, 08 Apr</p>
                                    </div>
                                    
                                    <div className="flex-1 px-4 flex flex-col items-center gap-1">
                                        <div className="px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                                            <span className="text-[10px] font-black text-gray-500 tabular-nums">10h 05m</span>
                                        </div>
                                        <div className="w-full h-[1px] bg-gray-100 border-t border-dashed border-gray-300"></div>
                                    </div>

                                    <div className="text-right space-y-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Indore</p>
                                        <p className="text-xl font-black text-gray-900 tabular-nums">06:05 AM</p>
                                        <p className="text-[11px] font-bold text-gray-500">Thu, 09 Apr</p>
                                    </div>
                                </div>

                                <hr className="border-gray-50 border-dashed" />

                                <div className="space-y-6 relative">
                                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 border-l-2 border-dashed border-gray-100"></div>
                                    
                                    <div className="flex gap-4 relative">
                                        <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-300 z-10 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none mb-1.5">Pick-up point</p>
                                            <p className="text-[11px] font-bold text-gray-500 leading-relaxed uppercase tracking-tighter pr-4">
                                                {selectedPickupPoint?.name || "Hans Travels, Balaji Building Neema Heart Hospital..."}, 8878131458,
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 relative">
                                        <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-300 z-10 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none mb-1.5">Drop-off point</p>
                                            <p className="text-[11px] font-bold text-gray-500 leading-relaxed uppercase tracking-tighter pr-4">
                                                {selectedDropoffPoint?.name || "Hans Travels Office, Pipliyahana In Front Of Pink City..."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bus Pass Card */}
                        <div className="bg-blue-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-blue-100/50">
                            <div className="flex justify-between items-start relative z-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Wine size={16} />
                                        <span className="text-xs font-black uppercase tracking-widest">Bus Pass</span>
                                    </div>
                                    <h3 className="text-4xl font-black">₹70</h3>
                                    <p className="text-[13px] font-bold text-blue-100">Get flat ₹50 off on every ride for 5 rides</p>
                                    <button className="text-[11px] font-black underline uppercase tracking-widest">Know more</button>
                                </div>
                                <button className="bg-white/20 backdrop-blur-md px-10 py-3 rounded-lg font-black text-sm border border-white/30 hover:bg-white/30 transition-all">Add</button>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                        </div>

                        {/* Coupon Banner */}
                        <div className="bg-[#e8f5e9] py-4 px-5 rounded-xl flex items-center justify-between border border-[#c8e6c9]/50">
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={20} className="text-[#2e7d32]" />
                                <span className="text-sm font-black text-[#2e7d32]">Save more with coupons</span>
                            </div>
                            <ChevronRight size={18} className="text-[#2e7d32]" />
                        </div>

                        {/* Policies Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-2 divide-y divide-gray-50">
                            <div className="py-4 flex items-center justify-between cursor-pointer group">
                                <span className="text-[15px] font-black text-gray-900">Cancellation Policy</span>
                                <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                            </div>
                            <div className="py-4 flex items-center justify-between cursor-pointer group">
                                <span className="text-[15px] font-black text-gray-900">Booking Policy</span>
                                <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>

                        {/* Travellers Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-gray-900 px-1">Travellers</h3>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                                {selectedSeats.map(seatId => (
                                    <div key={seatId} className="flex justify-between items-center">
                                        <span className="text-[15px] font-bold text-gray-900">
                                            {passengers[seatId]?.firstName} {passengers[seatId]?.lastName}, {passengers[seatId]?.age} ({passengers[seatId]?.gender?.charAt(0)})
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[15px] font-black text-gray-900">{seatId}</span>
                                            <Wine size={16} className="text-gray-400" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Details Summary */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-gray-900 px-1">Ticket details will be sent to</h3>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                                <div className="flex items-center gap-4 text-gray-600">
                                    <Info size={18} className="shrink-0" />
                                    <span className="text-[15px] font-bold">palakpatel0342@gmail.com</span>
                                </div>
                                <div className="flex items-center gap-4 text-gray-600">
                                    <Contact2 size={18} className="shrink-0" />
                                    <span className="text-[15px] font-bold">+91 8770620342</span>
                                </div>
                            </div>
                        </div>

                        {/* Price Breakup Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-gray-900 px-1">Price breakup</h3>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                                <div className="flex justify-between items-center text-[15px] font-bold text-gray-600">
                                    <span>Base fare ({selectedSeats.length} traveller{selectedSeats.length > 1 ? 's' : ''})</span>
                                    <span className="text-gray-900">₹{baseFare}</span>
                                </div>
                                <div className="flex justify-between items-center text-[15px] font-bold text-gray-600">
                                    <span>Tax</span>
                                    <span className="text-gray-900">₹{tax}</span>
                                </div>
                                <div className="flex justify-between items-center text-[15px] font-bold text-gray-600">
                                    <span>Convenience fee</span>
                                    <span className="text-gray-900">₹{convenienceFee}</span>
                                </div>
                                <hr className="border-gray-50 h-[2px] bg-gray-50" />
                                <div className="flex justify-between items-center text-[17px] font-black text-gray-900">
                                    <span>Total amount payable</span>
                                    <span>₹{totalPrice}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            ) : bookingStep === 'payment' ? (
                <main className="flex-1 bg-[#f8f9fa] overflow-y-auto pb-[140px]">
                    <div className="p-4 space-y-6">
                        {/* Final Amount Summary */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total amount to pay</p>
                                <h3 className="text-2xl font-black text-gray-900 mt-1">₹{totalPrice}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                <ShieldCheck size={24} />
                            </div>
                        </div>

                        {/* UPI Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Recommended / UPI</h3>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                                {[
                                    { id: 'gpay', name: 'Google Pay', icon: 'G' },
                                    { id: 'phonepe', name: 'PhonePe', icon: 'P' },
                                    { id: 'paytm', name: 'Paytm UPI', icon: 'T' }
                                ].map((method) => {
                                    const isSelected = selectedPayment === method.id;
                                    return (
                                        <button 
                                            key={method.id} 
                                            onClick={() => setSelectedPayment(method.id)}
                                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-all active:scale-[0.98]"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-blue-600'}`}>
                                                    {method.icon}
                                                </div>
                                                <span className={`text-[15px] font-black transition-all ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                                                    {method.name}
                                                </span>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-200'}`}>
                                                {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Other Options */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Other payment methods</h3>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                                {[
                                    { name: 'Credit / Debit Card', icon: <Contact2 size={20} /> },
                                    { name: 'Net Banking', icon: <Navigation size={20} className="-rotate-90" /> },
                                    { name: 'Wallets', icon: <Wine size={20} /> }
                                ].map((method, idx) => {
                                    const methodId = `other-${idx}`;
                                    const isSelected = selectedPayment === methodId;
                                    return (
                                        <button 
                                            key={idx} 
                                            onClick={() => setSelectedPayment(methodId)}
                                            className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-all active:scale-[0.98]"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`transition-all ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                                                    {method.icon}
                                                </div>
                                                <span className={`text-[15px] font-black transition-all ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                                                    {method.name}
                                                </span>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-200'}`}>
                                                {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* trust badge */}
                        <div className="flex flex-col items-center justify-center py-6 space-y-3 opacity-30">
                            <div className="flex gap-4">
                                <ShieldCheck size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">100% Secure Payments</span>
                            </div>
                            <p className="text-[9px] font-bold uppercase tracking-tighter">PCI-DSS Certified • SSL Encrypted</p>
                        </div>
                    </div>
                </main>
            ) : (
                <main className="flex-1 bg-[#fafafa] flex flex-col">
                    {/* Search and Date Header */}
                    <div className="bg-white p-4 space-y-4">
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder={`Search for ${bookingStep}-off point`.replace('pick-off', 'pick-up')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-blue-200 rounded-xl px-12 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all placeholder:text-gray-400 placeholder:font-bold"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <Info size={18} />
                            </div>
                        </div>
                        <div className="bg-gray-100/50 py-2 px-4 rounded-lg">
                            <span className="text-sm font-black text-gray-600 tracking-tight">08 Apr, 2026</span>
                        </div>
                    </div>

                    {/* Points List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {filteredPoints.length > 0 ? (
                            filteredPoints.map((point: Point) => {
                                const isSelected = bookingStep === 'pickup' ? selectedPickup === point.id : selectedDropoff === point.id;
                                return (
                                    <motion.div 
                                        key={point.id}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            if (bookingStep === 'pickup') setSelectedPickup(point.id);
                                            else setSelectedDropoff(point.id);
                                        }}
                                        className="bg-white rounded-[24px] border border-gray-100 p-5 flex gap-4 items-start shadow-sm cursor-pointer"
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 mt-1 flex items-center justify-center transition-all ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-200'}`}>
                                            {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-base font-black text-gray-900 leading-tight flex-1 pr-4">{point.name}</h3>
                                                <span className="text-base font-black text-gray-900">{point.time}</span>
                                            </div>
                                            <p className="text-[11px] font-bold text-gray-400 mt-2 leading-relaxed uppercase tracking-tighter">
                                                {point.sub}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <Info size={40} className="mb-4 opacity-20" />
                                <p className="text-sm font-black uppercase tracking-widest">No matching points found</p>
                            </div>
                        )}
                    </div>
                </main>
            )}

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-100 px-6 py-5 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-8">
                <div>
                    <h4 className="text-xl font-black text-gray-900 flex items-baseline gap-1.5">
                        {selectedSeats.length === 0 && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Starting from</span>}
                        <span>₹{bookingStep === 'review' || bookingStep === 'payment' ? totalPrice : (selectedSeats.length > 0 ? baseFare : basePrice)}</span>
                        {selectedSeats.length > 0 && (
                            <span className="text-[10px] text-blue-600 font-black uppercase tracking-tight">
                                ({selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'})
                            </span>
                        )}
                    </h4>
                    <button className="text-[11px] font-bold text-blue-600 border-b border-transparent hover:border-blue-200 transition-all">
                        View breakup
                    </button>
                </div>
                
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        if (bookingStep === 'seats') setBookingStep('pickup');
                        else if (bookingStep === 'pickup') {
                            setBookingStep('dropoff');
                            setSearchQuery('');
                        } else if (bookingStep === 'dropoff') {
                            setBookingStep('passengers');
                        } else if (bookingStep === 'passengers') {
                            setBookingStep('review');
                        } else if (bookingStep === 'review') {
                            setBookingStep('payment');
                        } else {
                            // Final payment step
                            handlePaymentAction();
                        }
                    }}
                    disabled={
                        bookingStep === 'seats' ? selectedSeats.length === 0 :
                        bookingStep === 'pickup' ? !selectedPickup :
                        bookingStep === 'dropoff' ? !selectedDropoff :
                        bookingStep === 'passengers' ? selectedSeats.some(id => !passengers[id]?.firstName || !passengers[id]?.age) :
                        false
                    }
                    className={`
                        flex-1 max-w-[280px] py-4 rounded-2xl font-black text-sm transition-all uppercase tracking-widest
                        ${(
                            bookingStep === 'seats' ? selectedSeats.length > 0 :
                            bookingStep === 'pickup' ? selectedPickup :
                            bookingStep === 'dropoff' ? selectedDropoff :
                            bookingStep === 'passengers' ? !selectedSeats.some(id => !passengers[id]?.firstName || !passengers[id]?.age) :
                            true
                        )
                            ? 'bg-yellow-400 text-gray-900 shadow-xl shadow-yellow-100' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                    `}
                >
                    {bookingStep === 'seats' ? 'Select pick-up point' : 
                     bookingStep === 'pickup' ? 'Select drop-off point' : 
                     bookingStep === 'dropoff' ? 'Add travellers' :
                     bookingStep === 'passengers' ? 'PROCEED TO PAYMENT' :
                     bookingStep === 'review' ? 'Continue to payment' :
                     `Pay ₹${totalPrice}`}
                </motion.button>
            </div>
            {/* Redirection Overlay */}
            <AnimatePresence>
                {isRedirecting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8 text-center"
                    >
                        <motion.div
                            animate={{ 
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="bg-blue-50 p-8 rounded-[40px] mb-8"
                        >
                            <Loader2 size={64} className="text-blue-600 animate-spin" />
                        </motion.div>
                        <h2 className="text-2xl font-[1000] text-gray-900 mb-2 tracking-tight">Redirecting to {redirectApp}</h2>
                        <p className="text-sm font-bold text-gray-400 max-w-[240px] leading-relaxed">
                            Please complete the payment in the {redirectApp} app. Do not close this window.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BusSeatSelection;
