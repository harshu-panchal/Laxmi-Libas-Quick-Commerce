import React from 'react';
import { useNavigate } from 'react-router-dom';
import LaxmartEntryGrid from './components/LaxmartEntryGrid';

const LaxmartEntry: React.FC = () => {
    const navigate = useNavigate();

    // Mock data for "Still looking for these?"
    const recentQueries = [
        {
            name: 'Mobiles',
            image: '/mobile_product_laxmart_1774949247418.png'
        },
        {
            name: 'Finger Sleeves',
            image: '/finger_sleeves_laxmart_1774949266194.png'
        },
        {
            name: 'Men\'s Track Pants',
            image: '/track_pants_laxmart_1774949288576.png'
        }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-[#f3f4f6]">
            {/* Header / Location Bar */}
            <div className="bg-[#eff6ff] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-white p-1.5 rounded-md shadow-sm">
                        <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-gray-900">HOME</span>
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                        <span className="text-[11px] text-gray-500 truncate max-w-[180px]">
                            Adarsh Nagar, Sector b2 near riza kiran...
                        </span>
                    </div>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-yellow-200">
                    <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13 3l-1 5h4L7 21l1-8H4l9-10z" />
                        </svg>
                    </div>
                    <span className="text-sm font-bold text-gray-800">0</span>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-3 bg-white flex items-center gap-3 shadow-sm sticky top-0 z-30">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input 
                        type="text" 
                        placeholder="Search mobiles, fashion..." 
                        className="bg-transparent border-none outline-none text-sm w-full text-gray-700" 
                    />
                    <div className="flex items-center gap-3 border-l pl-3 ml-1 border-gray-200">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm text-gray-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 8h16" />
                    </svg>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-20">
                {/* Entry Grid */}
                <LaxmartEntryGrid />

                {/* Horizontal Scroll Section */}
                <div className="mt-4 px-3 mb-6">
                    <div className="bg-[#d9f85d] rounded-[24px] p-4 shadow-sm border border-[#e2f186]">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h2 className="text-[17px] font-extrabold text-gray-800 tracking-tight">Still looking for these?</h2>
                        </div>
                        
                        <div className="flex overflow-x-auto gap-3 scrollbar-hide pb-1">
                            {recentQueries.map((item, index) => (
                                <div 
                                    key={index}
                                    className="bg-white rounded-xl p-2 min-w-[124px] flex flex-col items-center shadow-sm border border-white/50"
                                >
                                    <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                                        <img 
                                            src={item.image} 
                                            alt={item.name} 
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-700 text-center uppercase tracking-tight">
                                        {item.name}
                                    </span>
                                </div>
                            ))}
                            {/* Empty card to match screenshot style */}
                            <div className="bg-white/40 rounded-xl min-w-[20px]"></div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LaxmartEntry;
