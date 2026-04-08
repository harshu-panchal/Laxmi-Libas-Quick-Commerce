import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Users, Info, ChevronRight, ShieldCheck, CreditCard, Receipt, Clock, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TravelCart: React.FC = () => {
    const navigate = useNavigate();

    // Mock data for display - in a real app this would come from a global state or search params
    const hotel = {
        name: 'Foxoso LA Beach Resort, Morjim',
        address: 'Morjim Beach Road, Near Turtle Nesting Site, Morjim, Goa',
        checkIn: '08 Apr, 2024 (12:00 PM)',
        checkOut: '09 Apr, 2024 (11:00 AM)',
        duration: '1 Night',
        image: '/hotel_resort_2.png'
    };

    const selectedRooms = [
        {
            id: 1,
            name: 'Premium Room with Balcony',
            qty: 2,
            price: 25758,
            originalPrice: 37000,
        },
        {
            id: 2,
            name: 'Luxury Suite with Sea View',
            qty: 1,
            price: 42500,
            originalPrice: 55000,
        }
    ];

    const priceSummary = {
        basePrice: 94016,
        savings: 35000,
        taxes: 12045,
        total: 106061
    };

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
                            <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <h2 className="text-sm font-[1000] text-gray-900 leading-tight mb-2 line-clamp-2">{hotel.name}</h2>
                            <div className="flex items-start gap-1.5 text-gray-400">
                                <MapPin size={12} className="flex-shrink-0 mt-0.5" />
                                <span className="text-[10px] font-bold leading-tight">{hotel.address}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-5 border-t border-gray-100">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Check-In</span>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-blue-600" />
                                <span className="text-[11px] font-[1000] text-gray-800">{hotel.checkIn}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Check-Out</span>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-blue-600" />
                                <span className="text-[11px] font-[1000] text-gray-800">{hotel.checkOut}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Selected Rooms Detail */}
                <section className="bg-white rounded-[32px] shadow-sm border border-gray-50 p-5">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Room Details</h3>
                    <div className="space-y-4">
                        {selectedRooms.map((room) => (
                            <div key={room.id} className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <span className="text-xs font-[1000] text-gray-900">{room.name}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{room.qty} Room{room.qty > 1 ? 's' : ''} · 1 Night</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-[1000] text-gray-900 leading-none">₹{room.price.toLocaleString()}</span>
                                    <div className="flex items-center justify-end gap-1 leading-tight">
                                        <span className="text-[9px] font-bold text-gray-300 line-through">₹{room.originalPrice.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Coupons & Offers */}
                <section className="bg-white rounded-[32px] shadow-sm border border-gray-50 p-5 flex items-center justify-between group active:scale-[0.98] transition-all">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                            <Tag size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-[1000] text-gray-900 uppercase tracking-tight">Apply Coupon</span>
                            <span className="text-[10px] font-bold text-orange-600">Save up to 45% on this booking</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-orange-500 transition-colors" />
                </section>

                {/* Price Summary Breakdown */}
                <section className="bg-white rounded-[32px] shadow-sm border border-gray-50 overflow-hidden">
                    <div className="p-5 pb-2">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Price Breakdown</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-bold text-gray-700">
                                <span>Total Base Price</span>
                                <span>₹{priceSummary.basePrice.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-green-600">
                                <span>Coupon Savings</span>
                                <span>- ₹{priceSummary.savings.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-gray-700">
                                <div className="flex items-center gap-1.5">
                                    <span>Taxes & Fees</span>
                                    <Info size={12} className="text-gray-300" />
                                </div>
                                <span>₹{priceSummary.taxes.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 p-5 pt-4 bg-gray-50/50 flex justify-between items-center border-t border-gray-100">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Amount</span>
                            <span className="text-xl font-[1000] text-gray-900 mt-1">₹{priceSummary.total.toLocaleString()}</span>
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
                                Free cancellation until 24 hours before check-in. Non-refundable if cancelled after 07 Apr, 12:00 PM.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600">
                            <ShieldCheck size={16} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-[1000] text-gray-900 tracking-tight">Travel Insurance</span>
                            <p className="text-[10px] font-bold text-gray-500 leading-relaxed mt-1">
                                Secure your stay for ₹199 only. Covers accidental damage & emergencies.
                            </p>
                            <button className="self-start mt-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">Add Insurance</button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Sticky Bottom Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-50">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Payable Amount</span>
                    <span className="text-xl font-[1000] text-gray-900 mt-1">₹{priceSummary.total.toLocaleString()}</span>
                </div>
                <button 
                    onClick={() => {
                        // Navigate to actual travel checkout
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
