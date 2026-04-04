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
            <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-4">
                    <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                        Shipping Guidelines
                    </h2>
                    <div className="space-y-4 text-[13px] text-neutral-600 leading-relaxed">
                        <p>
                            The orders for the user are shipped through registered domestic courier companies and/or speed post only.
                        </p>
                        <p className="font-semibold text-neutral-800">
                            Orders are Delivered within 7 days from the date of the order and/or payment or as per the delivery date agreed at the time of order confirmation.
                        </p>
                        <p>
                            Delivering of the shipment is subject to courier company / post office norms. Platform Owner shall not be liable for any delay in delivery by the courier company / postal authority. 
                        </p>
                        <p>
                            Delivery of all orders will be made to the address provided by the buyer at the time of purchase. Delivery of our services will be confirmed on your email ID as specified at the time of registration.
                        </p>
                        <p className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 italic">
                            If there are any shipping cost(s) levied by the seller or the Platform Owner (as the case be), the same is not refundable.
                        </p>
                    </div>
                </div>

                <div className="text-center pt-8">
                    <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-widest">Last Updated: April 2026 • INDIA</p>
                </div>
            </div>
        </div>
    );
}
