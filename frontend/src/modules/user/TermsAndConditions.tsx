import { useNavigate } from 'react-router-dom';

export default function TermsAndConditions() {
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
                        <h1 className="text-lg font-bold text-neutral-900 tracking-tight">Terms & Conditions</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
                {[
                    {
                        title: '1. Acceptance',
                        content: 'By using LaxMart, you agree to these Terms and Conditions. If you do not agree, please do not use our services.'
                    },
                    {
                        title: '2. Account Terms',
                        items: [
                            'You must be 18+ to create an account.',
                            'You are responsible for account security.',
                            'Provide accurate information during registration.'
                        ]
                    },
                    {
                        title: '3. Service Use',
                        content: 'Services are for personal, non-commercial use only. Illegal or unauthorized use is prohibited.'
                    },
                    {
                        title: '4. Payments',
                        items: [
                            'Prices include applicable taxes.',
                            'Prices are subject to change without notice.',
                            'Use only authorized payment gateways.'
                        ]
                    },
                    {
                        title: '5. Intellectual Property',
                        content: 'All platform content is the property of LaxMart and protected by law. No unauthorized reproduction allowed.'
                    },
                    {
                        title: '6. Termination',
                        content: 'We reserve the right to suspend or terminate accounts for violations of these terms.'
                    }
                ].map((section, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
                        <h2 className="text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                            {section.title}
                        </h2>
                        {section.content && <p className="text-[13px] text-neutral-600 leading-relaxed">{section.content}</p>}
                        {section.items && (
                            <ul className="space-y-1.5">
                                {section.items.map((item, i) => (
                                    <li key={i} className="flex gap-2 text-[13px] text-neutral-600">
                                        <span className="text-teal-500">•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}

                <div className="text-center pt-8">
                    <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-widest">Last Updated: March 2026 • INDIA</p>
                </div>
            </div>
        </div>
    );
}
