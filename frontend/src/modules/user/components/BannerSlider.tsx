
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getActiveBanners, Banner } from '../../../services/api/bannerService';

export default function BannerSlider() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const response = await getActiveBanners();
                if (response.success && response.data.length > 0) {
                    setBanners(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch banners', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBanners();
    }, []);

    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners.length]);

    if (loading || banners.length === 0) return null;

    return (
        <div className="relative w-full h-40 md:h-64 overflow-hidden rounded-xl bg-neutral-100 mb-6 px-4 md:px-6 lg:px-8">
            <div className="relative w-full h-full overflow-hidden rounded-xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 cursor-pointer"
                        onClick={() => {
                            if (banners[currentIndex].link) {
                                window.location.href = banners[currentIndex].link!;
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
