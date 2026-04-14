import React, { useState, useEffect, useCallback } from 'react';
import { getActiveBanners, Banner } from '../../../services/api/bannerService';
import { useNavigate } from 'react-router-dom';

export default function HomeBannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchBanners = async () => {
    try {
      const response = await getActiveBanners('Home Page');
      if (response.success && response.data.length > 0) {
        setBanners(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch home banners', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const nextSlide = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide, banners.length]);

  if (loading || banners.length === 0) return null;

  return (
    <div className="px-3 pb-3 pt-2 relative overflow-hidden">
      <div className="relative h-[160px] sm:h-[180px] w-full max-w-[500px] mx-auto overflow-hidden rounded-[16px]">
        {banners.map((banner, index) => (
          <div
            key={banner._id}
            className={`absolute inset-0 transition-opacity duration-700 flex items-center cursor-pointer ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            onClick={() => {
              if (banner.link) {
                if (banner.link.startsWith('http')) {
                  window.open(banner.link, '_blank');
                } else {
                  navigate(banner.link);
                }
              }
            }}
          >
            {/* Image as background to cover fully */}
            <img 
              src={banner.imageUrl} 
              alt={banner.title || 'Banner'} 
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Overlay for text visibility if title exists */}
            {banner.title && (
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex items-center px-6">
                <div className="z-10">
                  <h2 className="text-white text-2xl font-black leading-tight drop-shadow-md">
                    {banner.title}
                  </h2>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Pagination Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {banners.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-4 bg-white' : 'w-1 bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
