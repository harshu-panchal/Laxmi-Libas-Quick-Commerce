import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from './components/ProductCard';
import { getProducts, getQuickProducts } from '../../services/api/customerProductService';
import { getHomeContent } from '../../services/api/customerHomeService';
import { Product } from '../../types/domain';
import { useLocation } from '../../hooks/useLocation';

const POPULAR_SEARCH_TAGS = [
  'DAV Uniform',
  'Shirt',
  'T-Shirt',
  'Saree',
  'Shoes',
  'Footwear',
  'Jockey',
  'Belt',
  'Tie',
  'Kurti'
];

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { location } = useLocation();
  const searchQuery = searchParams.get('q') || '';
  const isQuickPath = window.location.pathname.startsWith('/quick');
  const isQuickSection = isQuickPath || searchParams.get('section') === 'quick' || searchParams.get('quick') === 'true';
  
  // Local input state for smooth typing & debouncing
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [trendingItems, setTrendingItems] = useState<any[]>([]);
  const [cookingIdeas, setCookingIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(true);

  // Sync searchTerm when URL search param 'q' changes externally
  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  // Debounced URL sync (280ms) to prevent excessive requests while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchTerm.trim();
      if (trimmed !== searchQuery.trim()) {
        const newParams = new URLSearchParams(searchParams);
        if (trimmed) {
          newParams.set('q', trimmed);
        } else {
          newParams.delete('q');
        }
        navigate(`${window.location.pathname}?${newParams.toString()}`, { replace: true });
      }
    }, 280);

    return () => clearTimeout(handler);
  }, [searchTerm, searchQuery, searchParams, navigate]);

  // Request ID ref to prevent out-of-order race conditions
  const requestIdRef = useRef(0);

  // Fetch products based on active searchQuery with race-condition guard and cache bypass
  useEffect(() => {
    const currentRequestId = ++requestIdRef.current;
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const fetchProducts = async () => {
      try {
        const params: any = { search: trimmed };
        if (location?.latitude && location?.longitude) {
          params.latitude = location.latitude;
          params.longitude = location.longitude;
        }
        if (location?.city) {
          params.city = location.city;
        }

        // Pass useCache = false so customer search queries always return live, exact results
        const response = isQuickSection
          ? await getQuickProducts(params, false)
          : await getProducts(params, false);

        if (currentRequestId === requestIdRef.current) {
          setSearchResults((response.data as unknown as Product[]) || []);
        }
      } catch (error) {
        if (currentRequestId === requestIdRef.current) {
          console.error('Error searching products:', error);
          setSearchResults([]);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    fetchProducts();
  }, [searchQuery, location?.latitude, location?.longitude, location?.city, isQuickSection]);

  // Fetch trending/home content for initial view
  useEffect(() => {
    const fetchInitialContent = async () => {
      try {
        const response = await getHomeContent(
          undefined,
          location?.latitude,
          location?.longitude
        );
        if (response.success && response.data) {
          setTrendingItems(response.data.trending || []);
          setCookingIdeas(response.data.cookingIdeas || []);
        }
      } catch (error) {
        console.error("Error fetching search initial content", error);
      } finally {
        setContentLoading(false);
      }
    };

    if (!searchQuery.trim()) {
      fetchInitialContent();
    }
  }, [searchQuery, location?.latitude, location?.longitude]);

  // Direct submit on Enter or click
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = searchTerm.trim();
    const newParams = new URLSearchParams(searchParams);
    if (trimmed) {
      newParams.set('q', trimmed);
    } else {
      newParams.delete('q');
    }
    navigate(`${window.location.pathname}?${newParams.toString()}`, { replace: true });
  };

  const handleSelectTag = (tag: string) => {
    setSearchTerm(tag);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('q', tag);
    navigate(`${window.location.pathname}?${newParams.toString()}`, { replace: true });
  };

  const handleClear = () => {
    setSearchTerm('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('q');
    navigate(`${window.location.pathname}?${newParams.toString()}`, { replace: true });
  };

  return (
    <div className="pb-24 md:pb-8 bg-white min-h-screen">
      {/* Sticky Search Header */}
      <div className="sticky top-0 z-50 bg-white px-4 py-3 border-b border-neutral-100 shadow-sm">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-neutral-50 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex-1 relative flex items-center">
            <svg className="absolute left-3 w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              autoFocus
              placeholder={isQuickSection ? "Search in Quick Store..." : "Search for uniforms, sarees, shirts, shoes..."}
              className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 border border-neutral-200/80 rounded-xl text-sm focus:ring-2 focus:ring-primary-dark/20 focus:border-primary-dark transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={handleClear}
                className="absolute right-3 p-1 hover:bg-neutral-200 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </form>

        {/* Popular Search Suggestions Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pt-2.5 pb-0.5">
          <span className="text-[11px] font-bold text-neutral-400 whitespace-nowrap pl-0.5 uppercase tracking-wider">
            Popular:
          </span>
          {POPULAR_SEARCH_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleSelectTag(tag)}
              className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-all font-medium ${
                searchQuery.toLowerCase() === tag.toLowerCase()
                  ? 'bg-primary-dark text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {searchQuery.trim() && (
        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between mb-3 md:mb-5">
            <h2 className="text-base md:text-xl font-bold text-neutral-900 tracking-tight">
              Results for &ldquo;<span className="text-primary-dark">{searchQuery}</span>&rdquo;
            </h2>
            <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
              {loading ? 'Searching...' : `${searchResults.length} ${searchResults.length === 1 ? 'item' : 'items'} found`}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
              <p className="text-xs font-medium text-neutral-500">Searching exact matches...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {searchResults.map((product) => (
                <ProductCard
                  key={product.id || (product as any)._id}
                  product={product}
                  categoryStyle={true}
                  showBadge={true}
                  showPackBadge={false}
                  showStockInfo={false}
                  showRating={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 md:py-16 text-neutral-500 bg-neutral-50/50 rounded-2xl border border-neutral-100 p-6">
              <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3 text-neutral-400">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-base md:text-lg font-bold text-neutral-800 mb-1">No products found for &ldquo;{searchQuery}&rdquo;</p>
              <p className="text-xs md:text-sm text-neutral-500 max-w-sm mx-auto mb-4">
                Check for typos or try searching with generic terms like Uniform, Shirt, Shoes, or Saree.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {POPULAR_SEARCH_TAGS.slice(0, 6).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleSelectTag(tag)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:border-primary-dark transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trending in your city */}
      {!searchQuery.trim() && (
        <>
          {contentLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
            </div>
          )}

          {!contentLoading && trendingItems.length > 0 && (
            <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
              <h2 className="text-base md:text-xl font-bold text-neutral-900 mb-3 md:mb-5">Trending in your city</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
                {trendingItems.map((item) => (
                  <div
                    key={item.id || item._id}
                    className="bg-white rounded-xl border border-neutral-200/80 p-3 cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                    onClick={() => navigate(item.type === 'category' ? (isQuickSection ? `/quick/category/${item.id || item._id}` : `/category/${item.id || item._id}`) : `/product/${item.id || item._id}`)}
                  >
                    <div className="w-full h-24 rounded-lg mb-2 overflow-hidden bg-neutral-50 flex items-center justify-center">
                      {item.image || item.imageUrl ? (
                        <img
                          src={item.image || item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain bg-white rounded-sm"
                        />
                      ) : (
                        <div className="text-3xl">🔥</div>
                      )}
                    </div>
                    <div className="text-xs font-bold text-neutral-900 text-center line-clamp-2">
                      {item.name || item.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* See all products */}
          <div className="px-4 md:px-6 lg:px-8 py-2 md:py-4">
            <div 
              className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-yellow-200 cursor-pointer hover:shadow-sm transition-all"
              onClick={() => navigate('/categories')}
            >
              <div>
                <p className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Need something else?</p>
                <p className="text-sm font-semibold text-neutral-700">Explore all categories & collections</p>
              </div>
              <span className="text-xs font-bold bg-primary-dark text-white px-3 py-1.5 rounded-xl uppercase">
                Browse ▸
              </span>
            </div>
          </div>

          {/* Cooking ideas */}
          {!contentLoading && cookingIdeas.length > 0 && (
            <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
              <h2 className="text-base md:text-xl font-bold text-neutral-900 mb-3 md:mb-5">Recommended Items</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {cookingIdeas.map((idea, idx) => (
                  <div key={idea.id || idea._id || idx} className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-neutral-100 cursor-pointer shadow-sm hover:shadow-md transition-shadow" onClick={() => navigate(`/product/${idea.productId || idea.id}`)}>
                    {idea.image && <img src={idea.image} alt={idea.title} className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white text-xs font-bold line-clamp-2">{idea.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
