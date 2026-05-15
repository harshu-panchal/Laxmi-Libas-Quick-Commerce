import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories, getCategoryById } from "../../services/api/customerProductService";
import { useLocation } from "../../hooks/useLocation";
import { useCart } from "../../context/CartContext";
import { Search, Camera, ShoppingCart, ChevronRight } from "lucide-react";


export default function Categories() {
  const { location } = useLocation();
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rootCategories, setRootCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const { cart } = useCart();
  const navigate = useNavigate();

  // Fetch root categories on mount
  useEffect(() => {
    const fetchRoots = async () => {
      try {
        setLoading(true);
        setError(null);
        // Use tree=true to get hierarchy or just get root categories
        const response = await getCategories();
        if (response.success && response.data) {
          // Filter to only show root categories if the backend returns all
          const roots = response.data.filter((cat: any) => !cat.parentId);
          setRootCategories(roots);
          
          if (roots.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(roots[0].slug || roots[0]._id);
          }
        } else {
          setError("Failed to load categories.");
        }
      } catch (error) {
        console.error("Failed to fetch root categories:", error);
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoots();
  }, []);

  // Fetch subcategories when selected category changes
  useEffect(() => {
    const fetchSubs = async () => {
      if (!selectedCategoryId) return;

      try {
        setSubLoading(true);
        const response = await getCategoryById(selectedCategoryId);
        if (response.success && response.data) {
          setSubcategories(response.data.subcategories || []);
        }
      } catch (error) {
        console.error("Failed to fetch subcategories:", error);
      } finally {
        setSubLoading(false);
      }
    };

    fetchSubs();
  }, [selectedCategoryId]);

  const cartItemsCount = cart?.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;

  const currentCategory = useMemo(() => 
    rootCategories.find((cat: any) => (cat.slug || cat._id) === selectedCategoryId),
  [rootCategories, selectedCategoryId]);

  if (loading && rootCategories.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
      </div>
    );
  }

  if (error && rootCategories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary-dark text-white rounded-full"
        >
          Try Refreshing
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100 shrink-0">
        <h1 className="text-xl font-bold text-neutral-900">All Categories</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/search')} className="p-1">
            <Search size={22} className="text-neutral-700" />
          </button>
          <button onClick={() => navigate('/cart')} className="p-1 relative">
            <ShoppingCart size={22} className="text-neutral-700" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full border-2 border-white">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-24 bg-neutral-50 overflow-y-auto scrollbar-hide border-r border-neutral-100">
          {rootCategories.map((cat: any) => {
            const id = cat.slug || cat._id;
            const isActive = selectedCategoryId === id;
            
            return (
              <button
                key={id}
                onClick={() => setSelectedCategoryId(id)}
                className={`w-full flex flex-col items-center py-4 px-2 relative transition-all ${isActive ? 'bg-white' : 'transparent'}`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-dark rounded-r-full" />
                )}
                <div className={`w-12 h-12 rounded-xl mb-1.5 flex items-center justify-center overflow-hidden border-2 transition-all ${isActive ? 'border-primary-dark scale-110' : 'border-neutral-200'}`}>
                  <img
                    src={cat.image || cat.icon || "https://res.cloudinary.com/laxmart/image/upload/v1711966732/placeholder.png"}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://res.cloudinary.com/laxmart/image/upload/v1711966732/placeholder.png";
                    }}
                  />
                </div>
                <span className={`text-[10px] leading-tight text-center font-bold tracking-tight ${isActive ? 'text-primary-dark capitalize' : 'text-neutral-500 capitalize'}`}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Subcategories Content */}
        <div className="flex-1 overflow-y-auto bg-white p-4 pb-24 scrollbar-hide">
          {selectedCategoryId ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-50">
                <h2 className="text-lg font-bold text-neutral-900 capitalize">
                  {currentCategory?.name || 'Explore'}
                </h2>
                <button
                  onClick={() => navigate(`/category/${selectedCategoryId}`)}
                  className="flex items-center text-xs font-semibold text-primary-dark"
                >
                  View All Products <ChevronRight size={14} />
                </button>
              </div>

              {subLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-dark"></div>
                </div>
              ) : subcategories.length > 0 ? (
                <div className="grid grid-cols-3 gap-y-6 gap-x-4">
                  {subcategories.map((sub: any) => (
                    <button 
                      key={sub._id}
                      className="flex flex-col items-center gap-2 group"
                      onClick={() => navigate(`/category/${sub.slug || sub._id}`)}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center overflow-hidden group-active:scale-95 transition-transform shadow-sm">
                        <img 
                          src={sub.image || "https://res.cloudinary.com/laxmart/image/upload/v1711966732/placeholder.png"} 
                          alt={sub.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://res.cloudinary.com/laxmart/image/upload/v1711966732/placeholder.png";
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-neutral-700 text-center leading-tight line-clamp-2">
                        {sub.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-400">
                  <p className="text-sm">No subcategories found for this section.</p>
                  <button 
                    onClick={() => navigate(`/category/${selectedCategoryId}`)}
                    className="mt-4 text-xs font-bold text-primary-dark underline"
                  >
                    View All Products
                  </button>
                </div>
              )}
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

