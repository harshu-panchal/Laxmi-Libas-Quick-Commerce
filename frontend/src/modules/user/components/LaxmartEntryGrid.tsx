import React from 'react';
import { useNavigate } from 'react-router-dom';

const LaxmartEntryGrid: React.FC = () => {
    const navigate = useNavigate();

    const tiles = [
        {
            title: 'Laxmart',
            subtitle: 'Fashion, beauty, mobiles, electronics, and more',
            image: '/laxmart_fashion_tile_1774949163717.png',
            bgColor: 'linear-gradient(to bottom, #1e3a8a, #3b82f6)',
            path: '/user/home',
            textColor: 'white'
        },
        {
            title: 'Pay',
            subtitle: 'EMI, loans, cards, bills, and more',
            image: '/laxmart_pay_tile_1774949182667.png',
            bgColor: 'linear-gradient(to bottom, #4c1d95, #8b5cf6)',
            path: '#pay',
            textColor: 'white'
        },
        {
            title: 'Grocery',
            subtitle: 'Kitchen essentials at wholesale prices',
            image: '/laxmart_grocery_tile_1774949199910.png',
            bgColor: 'linear-gradient(to bottom, #7c2d12, #ea580c)',
            path: '#grocery',
            textColor: 'white'
        },
        {
            title: 'Travel',
            subtitle: 'Flights, hotels, and buses',
            image: '/laxmart_travel_tile_1774949219806.png',
            bgColor: 'linear-gradient(to bottom, #0369a1, #0ea5e9)',
            path: '/store/travel',
            textColor: 'white'
        }
    ];

    // Note: The image paths are absolute from the brain directory in this context. 
    // In a real app, they'd be imported. I'll use the generated paths for now.
    // I should probably use the actual generated paths which I have in my history.

    return (
        <div className="grid grid-cols-2 gap-3 px-4 py-4">
            {tiles.map((tile, index) => (
                <div
                    key={index}
                    onClick={() => navigate(tile.path)}
                    className="relative overflow-hidden rounded-2xl cursor-pointer aspect-[0.88] shadow-md group active:scale-[0.98] transition-all duration-200"
                    style={{ background: tile.bgColor }}
                >
                    <div className="absolute inset-0 z-0">
                        <img 
                            src={tile.image} 
                            alt={tile.title} 
                            className="w-full h-full object-cover opacity-95 group-hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                    {/* Darkening gradient overlay at the top for text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none"></div>
                    
                    <div className="relative z-10 p-4 flex flex-col h-full text-white">
                        <h3 className="text-[26px] font-extrabold italic tracking-tight leading-none drop-shadow-md">
                            {tile.title}
                        </h3>
                        <p className="text-[12px] leading-tight font-semibold mt-1.5 max-w-[85%] drop-shadow-sm opacity-95">
                            {tile.subtitle}
                        </p>
                    </div>
                    
                    {/* Premium border/glass effect */}
                    <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none"></div>
                </div>
            ))}
        </div>
    );
};

export default LaxmartEntryGrid;
