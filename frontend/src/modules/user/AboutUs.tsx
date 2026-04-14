import { useNavigate } from 'react-router-dom';

export default function AboutUs() {
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
                        <h1 className="text-lg font-bold text-neutral-900tracking-tight">About Us</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
                {/* Logo/Brand Section */}
                <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-neutral-100">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white mb-4 shadow-lg shadow-neutral-100 p-2 overflow-hidden">
                        <img 
                            src="/assets/laxmartlogo-removebg-preview.png" 
                            alt="LaxMart" 
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <h2 className="text-2xl font-black text-neutral-900 tracking-tight mb-1">LaxMart</h2>
                    <p className="text-xs font-medium text-teal-600 uppercase tracking-widest">Your Trusted Delivery Partner</p>
                </div>

                {/* Mission Section */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
                    <h3 className="text-sm font-bold text-neutral-900 mb-2 flex items-center gap-2 uppercase tracking-wider">
                        <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                        Our Mission
                    </h3>
                    <p className="text-[13px] text-neutral-600 leading-relaxed">
                        At LaxMart, we're committed to revolutionizing the way you shop. 
                        We provide lightning-fast delivery while maintaining the highest standards of quality.
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-sm">10K+</div>
                        <div className="text-[11px] text-neutral-500 font-medium leading-tight">Products Available</div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 text-teal-600 font-bold text-sm">500+</div>
                        <div className="text-[11px] text-neutral-500 font-medium leading-tight">Trusted Sellers</div>
                    </div>
                </div>

                {/* Why Choose Us */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
                    <h3 className="text-sm font-bold text-neutral-900 mb-4 uppercase tracking-wider">Why Choose Us</h3>
                    <div className="grid gap-4">
                        {[
                            { title: 'Fast Delivery', desc: 'Orders delivered at lightning speed.', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', color: 'text-amber-500' },
                            { title: 'Secure Payments', desc: 'Protected with industry encryption.', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', color: 'text-blue-500' },
                            { title: 'Quality First', desc: 'Trusted sellers for best products.', icon: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z', color: 'text-red-500' }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-3">
                                <div className={`w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center flex-shrink-0 ${item.color}`}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d={item.icon}></path>
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-[13px] font-bold text-neutral-900">{item.title}</h4>
                                    <p className="text-[11px] text-neutral-500 leading-tight">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Section */}
                <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl p-6 text-white shadow-xl shadow-neutral-200">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-teal-400 rounded-full"></div>
                        Direct Support
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-teal-400">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            </div>
                            <span className="text-xs font-medium opacity-90">support@laxmart.com</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-teal-400">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            </div>
                            <span className="text-xs font-medium opacity-90">+91 1800-123-4567</span>
                        </div>
                    </div>
                </div>

                {/* Version Info */}
                <div className="text-center pb-4">
                    <p className="text-[10px] text-neutral-400 font-medium">VERSION 1.0.0 • © 2024 LAXMART</p>
                </div>
            </div>
        </div>
    );
}
