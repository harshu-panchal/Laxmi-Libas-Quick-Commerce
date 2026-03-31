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
                        <h1 className="text-lg font-bold text-neutral-900 tracking-tight">Return & Refund Policy</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
                    <h2 className="text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                        Return Policy
                    </h2>
                    <p className="text-[13px] text-neutral-600 leading-relaxed mb-3">
                        You can return most items within 7 days of delivery if they are in original condition.
                    </p>
                    <ul className="space-y-2">
                        {[
                            '7-day window for return requests.',
                            'Item must be unused with original tags.',
                            'Tamper-evident seals must be intact.'
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
                        Refund Policy
                    </h2>
                    <p className="text-[13px] text-neutral-600 mb-3">Refunds are processed after the returned item passes our quality check.</p>
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center text-[10px] font-bold text-teal-600 flex-shrink-0">1</div>
                            <p className="text-[13px] text-neutral-600">Quality check completed within 48 hours.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center text-[10px] font-bold text-teal-600 flex-shrink-0">2</div>
                            <p className="text-[13px] text-neutral-600">Refund initiated immediately after approval.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center text-[10px] font-bold text-teal-600 flex-shrink-0">3</div>
                            <p className="text-[13px] text-neutral-600">Amount reflected in 5-7 business days.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
                    <h2 className="text-sm font-bold text-neutral-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                        Non-Returnable Items
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {['Innerwear', 'Perishables', 'Beauty Products', 'Customized Items'].map((tag, i) => (
                            <span key={i} className="px-2.5 py-1 bg-neutral-100 rounded-full text-[11px] font-medium text-neutral-600">{tag}</span>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
                    <h2 className="text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                        Support
                    </h2>
                    <p className="text-[13px] text-neutral-600">
                        For any return or refund queries, reach us at <a href="mailto:support@laxmart.com" className="text-teal-600 font-bold underline">support@laxmart.com</a>.
                    </p>
                </div>

                <div className="text-center pt-8">
                    <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-widest">Last Updated: March 2026</p>
                </div>
            </div>
        </div>
    );
}
