import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Users, Info, ChevronRight, ShieldCheck, CreditCard, Receipt, Clock, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TravelCart: React.FC = () => {
    const navigate = useNavigate();
    const [bookingData, setBookingData] = React.useState<any>(null);

    React.useEffect(() => {
        const saved = localStorage.getItem('activeTravelBooking');
        if (saved) {
            setBookingData(JSON.parse(saved));
        } else {
            // If no data, maybe redirect back
            // navigate('/store/travel');
        }
    }, []);

    if (!bookingData) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 text-center bg-[#f8f9fa]">
                <div>
                    <h2 className="text-xl font-black text-gray-900 mb-2">Cart is empty</h2>
                    <p className="text-sm text-gray-500 mb-6">Select a hotel or bus to continue booking.</p>
                    <button onClick={() => navigate('/store/travel')} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest">
                        Go to Travel
                    </button>
                </div>
            </div>
        );
    }

    const { 
        hotelName: name, 
        hotelAddress: address, 
        hotelImage: image, 
        checkIn, 
        checkOut, 
        rooms: selectedRooms,
        totalPrice: basePrice = 0,
        totalTaxes: taxes = 0,
        totalAmount: total = 0,
    } = bookingData;

    const totalOriginalPrice = (basePrice + taxes) * 1.3;
    const savings = Math.max(0, totalOriginalPrice - total);

    return (
        <div className="min-h-screen bg-[#f8f9fa] pb-24 font-['Inter']">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-4 shadow-sm">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-1 active:scale-90 transition-transform"
                >
                    <ArrowLeft size={24} className="text-gray-900" />
                </button>
                <h1 className="text-lg font-[1000] text-gray-900 tracking-tight">Review Booking</h1>
            </header>

            <main className="p-4 space-y-4">
                {/* Hotel Summary Card */}
                <section className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-50 p-5">
                    <div className="flex gap-4 mb-5">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100">
                            <img src={image} alt={name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <h2 className="text-sm font-[1000] text-gray-900 leading-tight mb-2 line-clamp-2">{name}</h2>
                            <div className="flex items-start gap-1.5 text-gray-400">
                                <MapPin size={12} className="flex-shrink-0 mt-0.5" />
                                <span className="text-[10px] font-bold leading-tight line-clamp-2">{address}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-5 border-t border-gray-100">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Check-In</span>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-blue-600" />
                                <span className="text-[11px] font-[1000] text-gray-800">{checkIn}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Check-Out</span>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-blue-600" />
                                <span className="text-[11px] font-[1000] text-gray-800">{checkOut}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Selected Rooms Detail */}
                <section className="bg-white rounded-[32px] shadow-sm border border-gray-50 p-5">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Room Details</h3>
                    <div className="space-y-4">
                        {selectedRooms.map((room: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <span className="text-xs font-[1000] text-gray-900">{room.name}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{room.qty} Room{room.qty > 1 ? 's' : ''} · 1 Night</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-[1000] text-gray-900 leading-none">₹{((room.price || 0) * (room.qty || 1)).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Price Summary Breakdown */}
                <section className="bg-white rounded-[32px] shadow-sm border border-gray-50 overflow-hidden">
                    <div className="p-5 pb-2">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Price Breakdown</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-bold text-gray-700">
                                <span>Total Base Price</span>
                                <span>₹{Math.round(basePrice).toLocaleString()}</span>
                            </div>
                            {savings > 0 && (
                                <div className="flex justify-between text-xs font-bold text-green-600">
                                    <span>Instant Savings</span>
                                    <span>- ₹{Math.round(savings).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xs font-bold text-gray-700">
                                <div className="flex items-center gap-1.5">
                                    <span>Taxes & Fees</span>
                                    <Info size={12} className="text-gray-300" />
                                </div>
                                <span>₹{Math.round(taxes).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 p-5 pt-4 bg-gray-50/50 flex justify-between items-center border-t border-gray-100">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Amount</span>
                            <span className="text-xl font-[1000] text-gray-900 mt-1">₹{Math.round(total).toLocaleString()}</span>
                        </div>
                        <div className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter">
                            Inclusive of all taxes
                        </div>
                    </div>
                </section>

                {/* Policies */}
                <section className="bg-white rounded-[32px] shadow-sm border border-gray-50 p-5 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600">
                            <Clock size={16} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-[1000] text-gray-900 tracking-tight">Cancellation Policy</span>
                            <p className="text-[10px] font-bold text-gray-500 leading-relaxed mt-1">
                                Free cancellation until 24 hours before check-in.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Sticky Bottom Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-50">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Payable Amount</span>
                    <span className="text-xl font-[1000] text-gray-900 mt-1">₹{Math.round(total).toLocaleString()}</span>
                </div>
                <button 
                    onClick={() => {
                        navigate('/store/travel/checkout');
                    }}
                    className="bg-yellow-400 text-gray-900 px-10 py-3.5 rounded-xl font-[1000] text-[12px] uppercase tracking-[0.1em] shadow-lg shadow-yellow-100 active:scale-95 transition-all"
                >
                    Proceed to pay
                </button>
            </div>
         </div>
    );
};

export default TravelCart;
