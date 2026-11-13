import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  ShieldCheck, 
  RotateCcw, 
  Flame, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  TrendingUp,
  Tag
} from 'lucide-react';
import ProductCard from './ProductCard';
import { Product } from '../../../types/domain';
import { getProducts } from '../../../services/api/customerProductService';

interface HomeSectionsEnhancerProps {
  homeData: {
    bestsellers?: any[];
    bestsellerProducts?: any[];
    dealsOfDay?: any[];
    trendingProducts?: any[];
    newArrivals?: any[];
    categoryHighlights?: any[];
    categories?: any[];
  };
  saveScrollPosition?: () => void;
}

export default function HomeSectionsEnhancer({ homeData, saveScrollPosition }: HomeSectionsEnhancerProps) {
  const navigate = useNavigate();

  // ── Countdown Timer for Deals of the Day ──
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 42, seconds: 18 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 6, minutes: 0, seconds: 0 }; // Reset
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Bottom Feed "Explore Catalog" ──
  const [activeCatalogTab, setActiveCatalogTab] = useState('all');
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        setCatalogLoading(true);
        const params: any = { limit: 20 };
        if (activeCatalogTab !== 'all') {
          params.search = activeCatalogTab;
        }
        const res = await getProducts(params, true);
        if (isMounted && res.success && res.data) {
          setCatalogProducts(res.data);
        }
      } catch (err) {
        console.error('Error fetching catalog products:', err);
      } finally {
        if (isMounted) setCatalogLoading(false);
      }
    };
    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, [activeCatalogTab]);

  const bestsellers = homeData.bestsellerProducts || [];
  const deals = homeData.dealsOfDay || [];
  const trending = homeData.trendingProducts || [];
  const categories = homeData.categoryHighlights || [];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* ── 1. Trust & Benefit Badges Strip ── */}
      <div className="px-4 md:px-6 lg:px-8 mt-2">
        <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-yellow-200/80 rounded-2xl p-3 md:p-4 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-yellow-500/15 text-yellow-700 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 fill-yellow-500 text-yellow-600" />
              </div>
              <div>
                <p className="text-[11px] md:text-xs font-bold text-neutral-900 leading-tight">Superfast Delivery</p>
                <p className="text-[9px] md:text-[10px] text-neutral-500">20-30 mins or Express</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] md:text-xs font-bold text-neutral-900 leading-tight">100% Quality Assured</p>
                <p className="text-[9px] md:text-[10px] text-neutral-500">Direct from certified sellers</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-700 flex items-center justify-center flex-shrink-0">
                <Tag className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[11px] md:text-xs font-bold text-neutral-900 leading-tight">Wholesale & Best Rates</p>
                <p className="text-[9px] md:text-[10px] text-neutral-500">Best price guaranteed</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-700 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-[11px] md:text-xs font-bold text-neutral-900 leading-tight">Easy Exchanges</p>
                <p className="text-[9px] md:text-[10px] text-neutral-500">Hassle-free return policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. 🔥 Best Sellers Products Showcase ── */}
      {bestsellers.length > 0 && (
        <section className="px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                <Flame className="w-4 h-4 fill-red-500" />
              </div>
              <div>
                <h2 className="text-base md:text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-1.5">
                  Best Sellers
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white tracking-wide uppercase">
                    Hot
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-500 hidden sm:block">Most ordered products by customers</p>
              </div>
            </div>
            <button
              onClick={() => {
                saveScrollPosition?.();
                navigate('/search?q=DAV');
              }}
              className="text-xs font-bold text-primary-dark hover:text-yellow-700 flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Horizontal Snap Scroll */}
          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {bestsellers.map((product) => (
              <div key={product.id || product._id} className="flex-none w-[150px] sm:w-[170px] md:w-[190px] snap-start">
                <ProductCard
                  product={product as Product}
                  categoryStyle={true}
                  showBadge={true}
                  badgeText="BESTSELLER"
                  showStockInfo={false}
                  showRating={true}
                  compact={true}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. ⚡ Deal of the Day Banner & Products ── */}
      {deals.length > 0 && (
        <section className="px-4 md:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 rounded-3xl p-4 md:p-6 text-white shadow-lg overflow-hidden relative">
            {/* Background decorative glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                  <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-black tracking-tight leading-tight uppercase">
                    DEALS OF THE DAY
                  </h3>
                  <p className="text-xs text-white/80 font-medium">Mega discounts on school wear & fashion essentials</p>
                </div>
              </div>

              {/* Countdown timer badge */}
              <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 w-fit">
                <Clock className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-[11px] font-semibold text-white/90">Ends in:</span>
                <span className="font-mono text-xs font-black text-yellow-300 tracking-wider">
                  {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Deals product cards horizontal slider */}
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3 pb-2 -mx-2 px-2 relative z-10">
              {deals.map((product) => (
                <div key={product.id || product._id} className="flex-none w-[150px] sm:w-[170px] md:w-[190px] snap-start">
                  <ProductCard
                    product={product as Product}
                    categoryStyle={true}
                    showBadge={true}
                    badgeText={`${product.discount || 20}% OFF`}
                    showStockInfo={false}
                    showRating={true}
                    compact={true}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 4. 👗 Explore Categories / Curated Collections ── */}
      {categories.length > 0 && (
        <section className="px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h2 className="text-base md:text-xl font-bold text-neutral-900 tracking-tight">
                Explore Top Categories
              </h2>
              <p className="text-[11px] text-neutral-500">Pick from our finest collections</p>
            </div>
            <button
              onClick={() => {
                saveScrollPosition?.();
                navigate('/categories');
              }}
              className="text-xs font-bold text-primary-dark hover:text-yellow-700 flex items-center gap-1 transition-colors"
            >
              All Categories <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3.5">
            {categories.slice(0, 8).map((cat: any) => (
              <div
                key={cat.id || cat.slug}
                onClick={() => {
                  saveScrollPosition?.();
                  navigate(`/category/${cat.slug || cat.id}`);
                }}
                className="group flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
              >
                <div className="w-full aspect-square rounded-2xl bg-white border border-neutral-200/80 shadow-sm p-1.5 sm:p-2 flex items-center justify-center overflow-hidden group-hover:shadow-md group-hover:border-primary-dark transition-all">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-amber-50 flex items-center justify-center text-xl font-black text-amber-700">
                      {cat.name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="mt-1.5 text-[11px] font-bold text-neutral-800 text-center line-clamp-2 leading-tight uppercase tracking-tight">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 5. ✨ Trending Now ── */}
      {trending.length > 0 && (
        <section className="px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base md:text-xl font-bold text-neutral-900 tracking-tight">
                  Trending Now
                </h2>
                <p className="text-[11px] text-neutral-500">Popular items this week</p>
              </div>
            </div>
            <button
              onClick={() => {
                saveScrollPosition?.();
                navigate('/search?q=shoes');
              }}
              className="text-xs font-bold text-primary-dark hover:text-yellow-700 flex items-center gap-1 transition-colors"
            >
              See More <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {trending.map((product) => (
              <div key={product.id || product._id} className="flex-none w-[150px] sm:w-[170px] md:w-[190px] snap-start">
                <ProductCard
                  product={product as Product}
                  categoryStyle={true}
                  showBadge={true}
                  badgeText="TRENDING"
                  showStockInfo={false}
                  showRating={true}
                  compact={true}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 6. 💎 Laxmi Libas Assurance Banner ── */}
      <div className="px-4 md:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 border border-neutral-700">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center flex-shrink-0 border border-yellow-400/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black uppercase tracking-wider text-yellow-400">Laxmi Libas Promise</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-bold uppercase">Verified</span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5 leading-snug">
                Premium School Uniforms, Sarees & Ethnic Clothing with genuine fabric guarantee and fast doorstep delivery.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              saveScrollPosition?.();
              navigate('/about');
            }}
            className="flex-shrink-0 text-xs font-bold text-neutral-900 bg-yellow-400 hover:bg-yellow-300 px-4 py-2 rounded-xl transition-all shadow-sm uppercase tracking-wider"
          >
            Learn More
          </button>
        </div>
      </div>

      {/* ── 7. 📦 Explore All Products Catalog Feed (Endless Browsing) ── */}
      <section className="px-4 md:px-6 lg:px-8 pt-2 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base md:text-xl font-bold text-neutral-900 tracking-tight">
              Explore Our Store
            </h2>
            <p className="text-[11px] text-neutral-500">Discover everything available in Laxmi Libas</p>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 -mx-2 px-2">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'DAV', label: 'Uniforms' },
              { id: 'Shirt', label: 'Shirts' },
              { id: 'Shoes', label: 'Footwear' },
              { id: 'Saree', label: 'Sarees' },
              { id: 'Grocery', label: 'Essentials' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCatalogTab(tab.id)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                  activeCatalogTab === tab.id
                    ? 'bg-primary-dark text-white shadow-sm'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {catalogLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-neutral-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : catalogProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {catalogProducts.map(product => (
              <ProductCard
                key={product.id || product._id}
                product={product}
                categoryStyle={true}
                showBadge={true}
                showStockInfo={false}
                showRating={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-2xl border border-neutral-100">
            <p className="text-sm font-semibold text-neutral-700">No products found in this tab</p>
            <button
              onClick={() => setActiveCatalogTab('all')}
              className="mt-2 text-xs font-bold text-primary-dark hover:underline"
            >
              Show all items
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

