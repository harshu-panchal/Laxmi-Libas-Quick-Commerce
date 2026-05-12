import { useNavigate, useParams, Link } from 'react-router-dom';
import { Product } from '../../types/domain';
import { useEffect, useState } from 'react';
import { getStoreProducts } from '../../services/api/customerHomeService';
import { useLocation } from '../../hooks/useLocation';
import ProductCard from './components/ProductCard';

export default function StorePage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { location } = useLocation();
    const [products, setProducts] = useState<Product[]>([]);
    const [shopData, setShopData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!slug) return;
            try {
                setLoading(true);

                // Fetch shop data and products using the shop API endpoint
                const response = await getStoreProducts(
                    slug,
                    location?.latitude,
                    location?.longitude
                );
                console.log(`[StorePage] Response for slug "${slug}":`, {
                    success: response.success,
                    productsCount: response.data?.length || 0,
                    shop: response.shop ? { name: response.shop.name, image: response.shop.image } : null,
                    message: response.message
                });
                if (response.success) {
                    setProducts(response.data || []);
                    setShopData(response.shop || null);
                } else {
                    setProducts([]);
                    setShopData(null);
                }
            } catch (error: any) {
                console.error('Failed to fetch store data:', error);
                console.error('Error details:', error.response?.data || error.message);
                setProducts([]);
                setShopData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug, location]);

    const storeName = shopData?.name || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1).replace('-', ' ') : 'Store');
    const [bannerImage, setBannerImage] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);

    // Determine banner image source
    useEffect(() => {
        if (shopData?.image) {
            setBannerImage(shopData.image);
            setImageError(false);
        } else if (slug) {
            // Try multiple possible image paths
            const possiblePaths = [
                `/assets/shopbystore/${slug}/${slug}header.png`,
                `/assets/shopbystore/${slug}/header.png`,
                `/assets/shopbystore/${slug}.png`,
                `/assets/shopbystore/${slug}.jpg`,
            ];
            setBannerImage(possiblePaths[0]);
            setImageError(false);
        } else {
            setBannerImage(null);
            setImageError(true);
        }
    }, [shopData, slug]);

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        const currentSrc = target.src;

        // Try fallback paths if current one fails
        if (slug && currentSrc.includes('/assets/shopbystore/')) {
            const fallbackPaths = [
                `/assets/shopbystore/${slug}/header.png`,
                `/assets/shopbystore/${slug}.png`,
                `/assets/shopbystore/${slug}.jpg`,
            ];
            const currentIndex = fallbackPaths.findIndex(path => currentSrc.includes(path));

            if (currentIndex < fallbackPaths.length - 1) {
                // Try next fallback path
                target.src = fallbackPaths[currentIndex + 1];
                return;
            }
        }

        // If all paths failed, show fallback
        setImageError(true);
        target.style.display = 'none';
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Store Banner */}
            <div className="relative w-full aspect-[2.5/1] bg-neutral-100 overflow-hidden">
                {bannerImage && !imageError ? (
                    <img
                        src={bannerImage}
                        alt={storeName}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                        loading="eager"
                    />
                ) : (
                    <div className="banner-fallback w-full h-full bg-gradient-to-r from-yellow-100 via-amber-50 to-orange-100 flex items-center justify-center">
                        <div className="text-5xl font-extrabold text-amber-500/30 tracking-wider uppercase">
                            {storeName}
                        </div>
                    </div>
                )}

                {/* Back button and Search */}
                <header className="absolute top-0 left-0 right-0 z-10">
                    <div className="px-4 py-3 flex items-center justify-between gap-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md bg-white/80 shadow-md hover:bg-white transition-all flex-shrink-0 border border-neutral-200/50"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M15 18L9 12L15 6" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        <button
                            onClick={() => navigate('/search')}
                            className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md bg-white/80 shadow-md hover:bg-white transition-all border border-neutral-200/50"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <circle cx="11" cy="11" r="8" stroke="#1f2937" strokeWidth="2.5" />
                                <path d="m21 21-4.35-4.35" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                </header>

                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/40 to-transparent" />
            </div>

            {/* Store Information Card (Premium Floating layout) */}
            <div className="px-4 -mt-12 relative z-20">
                <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-xl shadow-neutral-100/50">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1.5 flex-1">
                            <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">{storeName}</h1>
                            {shopData?.description && (
                                <p className="text-xs md:text-sm text-neutral-500 font-medium leading-relaxed max-w-xl">{shopData.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-xs text-neutral-500">
                                {shopData?.city && (
                                    <span className="flex items-center gap-1 font-semibold text-neutral-600 bg-neutral-50 px-2 py-1 rounded-md border border-neutral-100">
                                        📍 {shopData.city}
                                    </span>
                                )}
                                <span className="flex items-center gap-1 font-semibold text-primary-dark bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100/50">
                                    ⚡ {shopData?.deliveryType || 'Standard Shipping'}
                                </span>
                            </div>
                        </div>

                        {/* Rating Badge */}
                        <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl flex flex-col items-center justify-center text-center flex-shrink-0 shadow-sm">
                            <span className="text-base font-black text-emerald-700 flex items-center gap-0.5">
                                ⭐ {shopData?.rating || 4.8}
                            </span>
                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider pt-0.5">Rating</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Section */}
            <div className="px-4 py-8">
                <h3 className="text-lg font-bold text-neutral-900 mb-5">Top buys in {storeName}</h3>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                        {products.map((product) => (
                            <ProductCard
                                key={product._id || product.id}
                                product={product}
                                categoryStyle={true}
                                showBadge={true}
                                showPackBadge={false}
                                showStockInfo={false}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-neutral-500">
                        <p>No products found in this store yet.</p>
                        <Link to="/" className="text-primary-dark font-medium mt-2 inline-block">Explore other categories</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
