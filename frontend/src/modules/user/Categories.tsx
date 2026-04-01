import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHomeContent } from "../../services/api/customerHomeService";
import { useLocation } from "../../hooks/useLocation";
import { useCart } from "../../context/CartContext";
import { isClothingRelated } from "../../utils/clothingUtils";
import { CLOTHING_MOCK_DATA } from "../../utils/clothingMockData";
import ProductCard from "./components/ProductCard";
import { Search, Camera, ShoppingCart, ChevronRight } from "lucide-react";


export default function Categories() {
  const { location } = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homeData, setHomeData] = useState<any>({
    homeSections: [],
    categories: [],
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const { cart } = useCart();
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getHomeContent(
          undefined,
          location?.latitude || undefined,
          location?.longitude || undefined
        );
        if (response.success && response.data) {


          const filteredData = {
            ...response.data,
            categories: response.data.categories || [],
            homeSections: (response.data.homeSections || [])
              .map((section: any) => ({
                ...section,
                data: section.data || []
              }))
              .filter((section: any) => {
                return (section.data && section.data.length > 0) || section.displayType === "banners";
              }),
          };
          setHomeData(filteredData);
          if (filteredData.categories && filteredData.categories.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(filteredData.categories[0].slug || filteredData.categories[0]._id);
          }
        } else {
          setError("Failed to load categories. Please try again.");
        }
      } catch (error) {
        console.error("Failed to fetch home content:", error);
        setError("Network error. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location?.latitude, location?.longitude]);

  if (loading && !homeData.homeSections?.length && !homeData.categories?.length) {
    return null; // Let global IconLoader handle it
  }

  if (error && !homeData.homeSections?.length && !homeData.categories?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center bg-white">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-600 mb-6 max-w-xs">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary-dark text-white rounded-full font-medium hover:bg-yellow-700 transition-colors"
        >
          Try Refreshing
        </button>
      </div>
    );
  }


  const cartItemsCount = cart?.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;

  const currentCategory = homeData.categories?.find((cat: any) => (cat.slug || cat._id) === selectedCategoryId);

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Premium Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100 shrink-0">
        <h1 className="text-xl font-bold text-neutral-900">All Categories</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/search')} className="p-1 hover:bg-neutral-50 rounded-full transition-colors">
            <Search size={22} className="text-neutral-700" />
          </button>
          <button className="p-1 hover:bg-neutral-50 rounded-full transition-colors">
            <Camera size={22} className="text-neutral-700" />
          </button>
          <button onClick={() => navigate('/cart')} className="p-1 relative hover:bg-neutral-50 rounded-full transition-colors">
            <ShoppingCart size={22} className="text-neutral-700" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full border-2 border-white">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Left) */}
        <div className="w-24 bg-neutral-50 overflow-y-auto scrollbar-hide border-r border-neutral-100">
          {homeData.categories?.map((cat: any) => {
            const id = cat.slug || cat._id;
            const isActive = selectedCategoryId === id;
            return (
              <button
                key={id}
                onClick={() => setSelectedCategoryId(id)}
                className={`w-full flex flex-col items-center py-4 px-2 relative transition-all ${isActive ? 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]' : 'transparent'
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-dark rounded-r-full" />
                )}
                <div className={`w-12 h-12 rounded-full mb-1.5 flex items-center justify-center overflow-hidden border-2 transition-all ${isActive ? 'border-primary-dark/20 scale-110' : 'border-transparent'
                  }`}>
                  <img
                    src={cat.image || "https://res.cloudinary.com/laxmart/image/upload/v1711966732/placeholder.png"}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={`text-[10px] leading-tight text-center font-bold tracking-tight ${isActive ? 'text-primary-dark capitalize' : 'text-neutral-500 capitalize'
                  }`}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content (Right) */}
        <div className="flex-1 overflow-y-auto bg-white p-4 pb-24 scrollbar-hide">
          {selectedCategoryId ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Category Breadcrumb/Title */}
              <div className="flex items-center justify-between pb-2 border-b border-neutral-50">
                <h2 className="text-lg font-bold text-neutral-900 capitalize italic">
                  {currentCategory?.name || 'Explore'}
                </h2>
                <button
                  onClick={() => navigate(`/category/${selectedCategoryId}`)}
                  className="flex items-center text-xs font-semibold text-primary-dark hover:gap-1 transition-all"
                >
                  View All <ChevronRight size={14} />
                </button>
              </div>

              {/* Popular Stores Section (Circles) */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-neutral-800 tracking-tight">Popular Store</h3>
                </div>
                <div className="grid grid-cols-3 gap-y-6 gap-x-4">
                  {(isClothingRelated(currentCategory?.name || '') && homeData.homeSections?.filter((s: any) => s.displayType === 'categories')?.flatMap((s: any) => s.data)?.length === 0
                    ? CLOTHING_MOCK_DATA.subcategories
                    : homeData.homeSections
                        ?.filter((s: any) => s.displayType === 'categories' || s.displayType === 'banners')
                        ?.flatMap((s: any) => s.data)
                        ?.slice(0, 6)
                  )?.map((item: any, idx: number) => (
                      <button 
                        key={idx}
                        className="flex flex-col items-center gap-2 group"
                        onClick={() => navigate(item.type === 'category' ? `/category/${item.categoryId}` : '/')}
                      >
                        <div className="w-16 h-16 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center overflow-hidden group-active:scale-95 transition-transform">
                          <img 
                            src={item.image || item.imageUrl || "https://res.cloudinary.com/laxmart/image/upload/v1711966732/placeholder.png"} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-700 text-center leading-tight">
                          {item.name || item.title || 'Special'}
                        </span>
                      </button>
                    ))}
                </div>
              </section>

              {/* New & Upcoming Launches (Grid with badges) */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-neutral-800 tracking-tight">New & Upcoming Launches</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(isClothingRelated(currentCategory?.name || '') && homeData.homeSections?.find((s: any) => s.displayType === 'products')?.data?.length === 0
                    ? CLOTHING_MOCK_DATA.products
                    : homeData.homeSections
                        ?.find((s: any) => s.displayType === 'products')
                        ?.data?.slice(0, 4)
                  )?.map((product: any, idx: number) => (
                      <div key={idx} className="relative group">
                        <div className="absolute top-2 left-2 z-10">
                          <span className={`${idx % 2 === 0 ? 'bg-emerald-500' : 'bg-primary-dark'} text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase`}>
                            {idx % 2 === 0 ? 'NOTIFY ME' : 'BUY NOW'}
                          </span>
                        </div>
                        <ProductCard
                          product={product}
                          compact={true}
                          categoryStyle={true}
                          showBadge={false}
                        />
                      </div>
                    ))}
                </div>
              </section>

              {/* Recently Viewed / Stores */}
              <section className="pb-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-neutral-800 tracking-tight">Recently Viewed Stores</h3>
                </div>
                <div className="flex overflow-x-auto gap-4 scrollbar-hide pb-2">
                  {homeData.categories?.slice(0, 5).map((cat: any, idx: number) => (
                    <div key={idx} className="shrink-0 w-28 aspect-[4/5] rounded-xl bg-neutral-50 overflow-hidden border border-neutral-100">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-400 font-medium">
              Select a category to explore
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

