import { useNavigate } from 'react-router-dom';

export default function ShippingPolicy() {
    const navigate = useNavigate();

    return (
        <div className="pb-20 bg-neutral-50 min-h-screen">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md pb-4 pt-4 sticky top-0 z-10 border-b border-neutral-100">
                <div className="px-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors"
                            aria-label="Back"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <h1 className="text-lg font-bold text-neutral-900 tracking-tight">Shipping Policy</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
                    <h2 className="text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                        Shipping Timelines
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[13px]">
                            <span className="text-neutral-500">Local Delivery</span>
                            <span className="font-bold text-teal-600">2-4 Hours</span>
                        </div>
                        <div className="flex justify-between items-center text-[13px]">
                            <span className="text-neutral-500">Regional Shipping</span>
                            <span className="font-bold text-teal-600">1-2 Days</span>
                        </div>
                        <div className="flex justify-between items-center text-[13px]">
                            <span className="text-neutral-500">National Shipping</span>
                            <span className="font-bold text-teal-600">3-5 Days</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
                    <h2 className="text-sm font-bold text-neutral-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                        Shipping Rates
                    </h2>
                    <p className="text-[13px] text-neutral-600 leading-relaxed mb-3">
                        Shipping charges are calculated based on weight, distance, and chosen delivery speed.
                    </p>
                    <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
                        <p className="text-[11px] font-bold text-teal-700 uppercase tracking-widest mb-1">PROMOTION</p>
                        <p className="text-[13px] text-teal-600">Free delivery on orders above ₹499!</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
                    <h2 className="text-sm font-bold text-neutral-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                        Order Tracking
                    </h2>
                    <p className="text-[13px] text-neutral-600 leading-relaxed">
                        Once your order is shipped, you will receive a tracking link via SMS/Email and within the "My Orders" section of your account.
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
                    <h2 className="text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                        Delivery Policy
                    </h2>
                    <ul className="space-y-1.5">
                        {[
                            'Verification of ID may be required for certain items.',
                            'Orders placed after 8 PM are processed next day.',
                            'We currently deliver across all major pin codes.'
                        ].map((item, i) => (
                            <li key={i} className="flex gap-2 text-[13px] text-neutral-600">
                                <span className="text-teal-500">•</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="text-center pt-8">
                    <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-widest">Last Updated: March 2026</p>
                </div>
            </div>
        </div>
    );
}
