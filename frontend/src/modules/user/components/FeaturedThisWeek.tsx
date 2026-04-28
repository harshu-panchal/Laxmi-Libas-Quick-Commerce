import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getProducts } from '../../../services/api/customerProductService';
// import { isClothingRelated } from '../../../utils/clothingUtils';


export default function FeaturedThisWeek() {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        // Fetch products that are marked as featured or trending
        const res = await getProducts({ limit: 10 });
        if (res.success && res.data) {
          // In a real system, we might have a 'isFeatured' flag. 
          // For now, we take the top 10 items.
          setFeaturedProducts(res.data.slice(0, 10));
        }
      } catch (e) {
        console.error("Failed to fetch featured products:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  if (loading || featuredProducts.length === 0) return null;

  return (
    <div className="mb-6 mt-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-3 px-4 tracking-tight">
        Featured this week
      </h2>
      <div className="px-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
          {featuredProducts.map((product) => (
            <div 
              key={product.id || product._id} 
              className="flex-none w-[140px]"
              onClick={() => navigate(`/product/${product.id || product._id}`)}
            >
              <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden flex flex-col h-full cursor-pointer active:scale-95 transition-all">
                <div className="aspect-square bg-neutral-50 relative">
                  <img 
                    src={product.imageUrl || product.mainImage} 
                    alt={product.name} 
                    className="w-full h-full object-contain p-2"
                  />
                  {product.discount > 0 && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                      {product.discount}% OFF
                    </div>
                  )}
                </div>
                <div className="p-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-bold text-neutral-800 line-clamp-2 leading-tight mb-1">
                      {product.name}
                    </h3>
                    <p className="text-[9px] text-neutral-500">{product.pack}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] font-black text-neutral-900">₹{product.price}</span>
                    <button className="bg-primary-dark text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase">
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
