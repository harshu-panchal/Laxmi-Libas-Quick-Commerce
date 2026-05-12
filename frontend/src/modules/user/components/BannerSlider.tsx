
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getActiveBanners, Banner } from '../../../services/api/bannerService';
import { useNavigate } from 'react-router-dom';

export default function BannerSlider({ pageLocation = 'Home Page' }: { pageLocation?: string }) {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                // Fetch banners dynamically based on page location
                const response = await getActiveBanners(pageLocation);
                if (response.success && response.data.length > 0) {
                    setBanners(response.data);
                }
            } catch (error) {
                console.error(`Failed to fetch banners for ${pageLocation}`, error);
            } finally {
                setLoading(false);
            }
        };
        fetchBanners();
    }, [pageLocation]);

    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners.length]);

    if (loading || banners.length === 0) return null;

    return (
        <div className="relative w-full h-40 md:h-64 overflow-hidden rounded-[20px] bg-neutral-100 mb-2">
            <div className="relative w-full h-full overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 cursor-pointer"
                        onClick={() => {
                            const url = banners[currentIndex].redirectUrl || banners[currentIndex].link;
                            if (!url) return;

                            const type = banners[currentIndex].redirectType || 'external';

                            if (type === 'external' || url.startsWith('http://') || url.startsWith('https://')) {
                                window.open(url, '_blank');
                                return;
                            }

                            if (type === 'product') {
                                navigate(`/product/${url.replace(/^\//, '')}`);
                                return;
                            }

                            if (type === 'category') {
                                navigate(`/category/${url.replace(/^\//, '')}`);
                                return;
                            }

                            if (type === 'hotel') {
                                navigate(`/hotels`);
                                return;
                            }

                            if (type === 'bus') {
                                navigate(`/buses`);
                                return;
                            }

                            if (type === 'quick') {
                                navigate(`/quick`);
                                return;
                            }

                            if (url.startsWith('/')) {
                                navigate(url);
                            } else {
                                navigate(`/${url}`);
                            }
                        }}
                    >
                        <img
                            src={banners[currentIndex].imageUrl}
                            alt={banners[currentIndex].title || 'Banner'}
                            className="w-full h-full object-cover rounded-xl"
                        />
                        {banners[currentIndex].title && (
                            <div className="absolute bottom-4 left-4 bg-black/30 backdrop-blur-md px-4 py-2 rounded-lg text-white">
                                <h3 className="text-sm md:text-lg font-bold">{banners[currentIndex].title}</h3>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Dots */}
                {banners.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentIndex(index);
                                }}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
