import { useNavigate } from 'react-router-dom';

export default function ReturnAndRefundPolicy() {
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
                        <h1 className="text-lg font-bold text-neutral-900 tracking-tight">Return & Refund</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-8">
                    {/* Return Policy */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                            Return Policy
                        </h2>
                        <p className="text-[13px] text-neutral-600 leading-relaxed font-semibold">
                            We offer Return within the first 7 day from the date of your purchase.
                        </p>
                        <p className="text-[13px] text-neutral-600 leading-relaxed">
                            If 7 days have passed since your purchase, you will not be offered a return.
                        </p>
                    </div>

                    {/* Refund Policy */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                            Refund Policy
                        </h2>
                        <p className="text-[13px] text-neutral-600 leading-relaxed font-semibold">
                            Refunds will take 7 days to be credited to your original payment method.
                        </p>
                        <p className="text-[13px] text-neutral-600 leading-relaxed">
                            In case of any refunds approved by the company, it will take standard 7 days for the refund amount to reflect in your original payment method (bank account, card, or wallet).
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
