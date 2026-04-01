import React, { useState, useEffect, useCallback } from 'react';

interface Slide {
  id: number;
  bgGradient: string;
  badge: string;
  title: string;
  subtitle: string;
  subtext: string;
  image: string;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    bgGradient: 'linear-gradient(135deg, #2196F3 0%, #bbdefb 100%)',
    badge: 'BIG BACHAT DAYS',
    title: 'Choppers',
    subtitle: 'From ₹99',
    subtext: 'Pigeon, butterfly & more',
    image: '/chopper_3d_banner_asset_1774952817258.png'
  },
  {
    id: 2,
    bgGradient: 'linear-gradient(135deg, #ff9800 0%, #ffe0b2 100%)',
    badge: 'KITCHEN SPECIAL',
    title: 'Mixer Grinders',
    subtitle: 'Up to 60% Off',
    subtext: 'Prestige, Bajaj & more',
    image: '/laxmart_grocery_tile_1774949199910.png' // Using existing asset for fallback
  }
];

export default function HomeBannerCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="px-3 pb-3 pt-2 relative overflow-hidden">
      <div className="relative h-[160px] sm:h-[180px] w-full max-w-[500px] mx-auto overflow-hidden rounded-[16px]">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 flex items-center ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            style={{ background: slide.bgGradient }}
          >
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            {/* Left Content */}
            <div className="flex-1 pl-6 z-10 flex flex-col justify-center">
              <div className="bg-[#ffec00] text-[#1d52a2] text-[10px] font-black px-2 py-0.5 rounded-sm inline-block w-fit mb-3 transform -rotate-1 shadow-sm">
                {slide.badge}
              </div>
              <h2 className="text-gray-900 text-2xl font-black leading-tight">
                {slide.title}
              </h2>
              <h3 className="text-gray-900 text-xl font-bold leading-tight">
                {slide.subtitle}
              </h3>
              <p className="text-gray-700 text-xs font-medium mt-1">
                {slide.subtext}
              </p>
            </div>

            {/* Right Product Image */}
            <div className="relative w-[140px] sm:w-[160px] h-full flex items-center justify-center pr-4">
              {/* Product Card Container */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-lg transform rotate-2">
                <img src={slide.image} alt={slide.title} className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] object-contain" />
              </div>

              {/* Decorative Floating items */}
              <div className="absolute top-4 right-8 w-6 h-6 bg-yellow-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
              <div className="absolute bottom-4 left-0 w-8 h-8 bg-blue-300 rounded-full blur-xl opacity-30"></div>
            </div>
          </div>
        ))}

        {/* Pagination Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-4 bg-gray-900/60' : 'w-1 bg-gray-900/20'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
