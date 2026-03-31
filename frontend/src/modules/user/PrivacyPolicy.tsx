import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
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
                        <h1 className="text-lg font-bold text-neutral-900 tracking-tight">Privacy Policy</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
                    <h2 className="text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                        Privacy Overview
                    </h2>
                    <p className="text-[13px] text-neutral-600 leading-relaxed">
                        LaxMart respects your privacy. This policy explains how we collect, use, and protect your personal information.
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
                    <h2 className="text-sm font-bold text-neutral-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                        Data Collection
                    </h2>
                    <ul className="space-y-2">
                        {[
                            'Name, email, and phone number for account setup.',
                            'Delivery address for order fulfillment.',
                            'Payment information via secure gateways.',
                            'Device info and app usage for analytics.'
                        ].map((item, i) => (
                            <li key={i} className="flex gap-2 text-[13px] text-neutral-600">
                                <span className="text-teal-500 mt-1">•</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
                    <h2 className="text-sm font-bold text-neutral-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                        How We Use Your Data
                    </h2>
                    <p className="text-[13px] text-neutral-600 leading-relaxed">
                        Your data is used to process orders, improve our services, and communicate important updates or promotional offers.
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
                    <h2 className="text-sm font-bold text-neutral-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                        Data Security
                    </h2>
                    <p className="text-[13px] text-neutral-600 leading-relaxed">
                        We implement industry-standard encryption and security measures to protect your data from unauthorized access.
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
                    <h2 className="text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                        Your Rights
                    </h2>
                    <p className="text-[13px] text-neutral-600">
                        You have the right to access, correct, or delete your personal information at any time via account settings or support.
                    </p>
                </div>

                <div className="text-center pt-8">
                    <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-widest">Last Updated: March 2026</p>
                </div>
            </div>
        </div>
    );
}
