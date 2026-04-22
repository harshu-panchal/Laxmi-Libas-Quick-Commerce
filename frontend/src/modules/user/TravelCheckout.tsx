import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { createHotelBooking } from '../../services/api/customerHotelService';

const TravelCheckout: React.FC = () => {
    const navigate = useNavigate();
    const [bookingData, setBookingData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);
    
    const [formData, setFormData] = React.useState({
        guestName: '',
        email: '',
        phone: '',
        specialRequest: ''
    });

    React.useEffect(() => {
        const saved = localStorage.getItem('activeTravelBooking');
        if (saved) {
            setBookingData(JSON.parse(saved));
        }
    }, []);

    const handleConfirm = async () => {
        if (!bookingData) return;
        if (!formData.guestName || !formData.email || !formData.phone) {
            alert('Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                hotelId: bookingData.hotelId,
                rooms: bookingData.rooms.map((r: any) => ({
                    roomId: r.id,
                    count: r.qty
                })),
                guestName: formData.guestName,
                email: formData.email,
                phone: formData.phone,
                checkIn: bookingData.checkIn,
                checkOut: bookingData.checkOut,
                amount: bookingData.totalAmount
            };

            console.log('🚀 Sending booking payload:', payload);
            const response = await createHotelBooking(payload);
            if (response.success) {
                // Update local storage with bookingId and type
                const updatedBooking = {
                    ...bookingData,
                    bookingId: response.data._id,
                    paymentType: 'hotel'
                };
                localStorage.setItem('activeTravelBooking', JSON.stringify(updatedBooking));
                navigate('/store/travel/payment');
            } else {
                alert(response.message || 'Booking failed');
            }
        } catch (error) {
            console.error('Booking Error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
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
                <h1 className="text-lg font-[1000] text-gray-900 tracking-tight">Guest Details</h1>
            </header>

            <main className="p-4 space-y-4">
                {/* Guest Form */}
                <section className="bg-white rounded-[32px] shadow-sm border border-gray-50 p-6">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Primary Guest</h3>
                    
                    <div className="space-y-6">
                        <div className="relative">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest absolute -top-2 left-4 bg-white px-1 z-10 font-['Inter']">Full Name</label>
                            <div className="flex items-center border-2 border-gray-50 bg-gray-50 rounded-2xl focus-within:border-blue-500 focus-within:bg-white transition-all">
                                <div className="pl-4 text-gray-400">
                                    <User size={18} />
                                </div>
                                <input 
                                    type="text" 
                                    value={formData.guestName}
                                    onChange={(e) => setFormData({...formData, guestName: e.target.value})}
                                    placeholder="Enter your full name" 
                                    className="w-full h-14 px-4 bg-transparent outline-none text-sm font-bold text-gray-900"
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest absolute -top-2 left-4 bg-white px-1 z-10">Email Address</label>
                            <div className="flex items-center border-2 border-gray-50 bg-gray-50 rounded-2xl focus-within:border-blue-500 focus-within:bg-white transition-all">
                                <div className="pl-4 text-gray-400">
                                    <Mail size={18} />
                                </div>
                                <input 
                                    type="email" 
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="Enter your email" 
                                    className="w-full h-14 px-4 bg-transparent outline-none text-sm font-bold text-gray-900"
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest absolute -top-2 left-4 bg-white px-1 z-10">Mobile Number</label>
                            <div className="flex items-center border-2 border-gray-50 bg-gray-50 rounded-2xl focus-within:border-blue-500 focus-within:bg-white transition-all">
                                <div className="pl-4 text-gray-400">
                                    <Phone size={18} />
                                </div>
                                <input 
                                    type="tel" 
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    placeholder="Enter mobile number" 
                                    className="w-full h-14 px-4 bg-transparent outline-none text-sm font-bold text-gray-900"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Requirements */}
                <section className="bg-white rounded-[32px] shadow-sm border border-gray-50 p-6">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Special Requests</h3>
                    <div className="flex items-start border-2 border-gray-50 bg-gray-50 rounded-2xl p-4 focus-within:border-blue-500 focus-within:bg-white transition-all">
                        <MessageSquare size={18} className="text-gray-400 mt-1" />
                        <textarea 
                            value={formData.specialRequest}
                            onChange={(e) => setFormData({...formData, specialRequest: e.target.value})}
                            placeholder="Early check-in, late check-out, or any other requests..." 
                            className="w-full h-24 px-4 bg-transparent outline-none text-sm font-bold text-gray-900 resize-none"
                        ></textarea>
                    </div>
                </section>
            </main>

            {/* Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-50">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Grand Total</span>
                    <span className="text-xl font-[1000] text-gray-900 mt-1">₹{(bookingData?.totalAmount || 0).toLocaleString()}</span>
                </div>
                <button 
                    disabled={loading}
                    onClick={handleConfirm}
                    className="bg-yellow-400 text-gray-900 px-8 py-3.5 rounded-xl font-[1000] text-[12px] uppercase tracking-[0.1em] shadow-lg shadow-yellow-100 active:scale-95 transition-all flex items-center gap-2"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div> : null}
                    Confirm Booking
                </button>
            </div>
        </div>
    );
};

export default TravelCheckout;
