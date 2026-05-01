import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { Product } from '../../../types/domain';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import { useLocation } from '../../../hooks/useLocation';
import { useToast } from '../../../context/ToastContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../components/ui/sheet';
import { addToWishlist, removeFromWishlist, getWishlist } from '../../../services/api/customerWishlistService';
import Button from '../../../components/ui/button';
import Badge from '../../../components/ui/badge';
import StarRating from '../../../components/ui/StarRating';
import { calculateProductPrice } from '../../../utils/priceUtils';

interface ProductCardProps {
  product: Product;
  showBadge?: boolean;
  badgeText?: string;
  showPackBadge?: boolean;
  showStockInfo?: boolean;
  showHeartIcon?: boolean;
  showRating?: boolean;
  showVegetarianIcon?: boolean;
  showOptionsText?: boolean;
  optionsCount?: number;
  compact?: boolean;
  categoryStyle?: boolean;
}

export default function ProductCard({
  product,
  showBadge = false,
  badgeText,
  showPackBadge = false,
  showStockInfo = false,
  showHeartIcon = false,
  showRating = false,
  showVegetarianIcon = false,
  showOptionsText = false,
  optionsCount = 2,
  compact = false,
  categoryStyle = false,
}: ProductCardProps) {
  // Global check to hide placeholder products
  const isMockProduct = 
    ((product.imageUrl || "").includes('10mins_icon_pink') || (product.mainImage || "").includes('10mins_icon_pink'));

  if (isMockProduct) return null;

  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const { location } = useLocation();
  const { showToast } = useToast(); // Get toast function
  const imageRef = useRef<HTMLImageElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  // Single ref to track any cart operation in progress for this product
  const isOperationPendingRef = useRef(false);
  const [isVariantSheetOpen, setIsVariantSheetOpen] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);

  useEffect(() => {
    // Only check wishlist if user is authenticated
    if (!isAuthenticated) {
      setIsWishlisted(false);
      return;
    }

    const checkWishlist = async () => {
      try {
        const res = await getWishlist({
          latitude: location?.latitude,
          longitude: location?.longitude
        });
        if (res.success && res.data && res.data.products) {
          const targetId = String((product as any).id || product._id);
          const exists = res.data.products.some(p => String(p._id || (p as any).id) === targetId);
          setIsWishlisted(exists);
        }
      } catch (e) {
        // Silently fail if not logged in
        setIsWishlisted(false);
      }
    };
    checkWishlist();
  }, [product.id, product._id, isAuthenticated, location?.latitude, location?.longitude]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const targetId = String((product as any).id || product._id);
    const previousState = isWishlisted;

    try {
      if (isWishlisted) {
        // Optimistic update
        setIsWishlisted(false);
        await removeFromWishlist(targetId);
        showToast('Removed from wishlist');
      } else {
        if (!location?.latitude || !location?.longitude) {
          showToast('Location is required to add items to wishlist', 'error');
          return;
        }
        // Optimistic update
        setIsWishlisted(true);
        await addToWishlist(
          targetId,
          location?.latitude,
          location?.longitude
        );
        showToast('Added to wishlist');
      }
    } catch (e: any) {
      console.error('Failed to toggle wishlist:', e);
      setIsWishlisted(previousState);
      const errorMessage = e.response?.data?.message || e.message || 'Failed to update wishlist';
      showToast(errorMessage, 'error');
    }
  };

  const cartItem = cart.items.find((item) => {
    if (!item?.product) return false;
    const itemProdId = String(item.product.id || item.product._id);
    const prodId = String((product as any).id || product._id);
    return itemProdId === prodId;
  });
  const inCartQty = cartItem?.quantity || 0;

  // Get Price and MRP using utility
  const { displayPrice, mrp, discount } = calculateProductPrice(product);

  const handleCardClick = () => {
    navigate(`/product/${((product as any).id || product._id) as string}`);
  };

  const handleAddType = async (e: React.MouseEvent, type: 'quick' | 'ecommerce') => {
    e.stopPropagation();
    e.preventDefault();

    isOperationPendingRef.current = true;

    try {
      // If product has multiple variations, force selection via sheet
      if (product.variations && product.variations.length > 1) {
        setIsVariantSheetOpen(true);
        // We'll need to store the selected type for when the variant is picked
        (product as any).pendingType = type;
        return;
      }

      await addToCart(product, addButtonRef.current, type);
    } finally {
      isOperationPendingRef.current = false;
    }
  };

  const handleAdd = async (e: React.MouseEvent) => {
    handleAddType(e, 'quick');
  };

  const handleVariantSelect = async (index: number) => {
    if (!product.variations) return;
    
    setSelectedVariantIndex(index);
    const variant = product.variations[index];
    const variantTitle = variant.title || variant.value || variant.name;
    
    const productWithVariant = {
      ...product,
      price: variant.price || product.price,
      mrp: variant.mrp || product.mrp,
      pack: variantTitle,
      selectedVariant: variant,
      variantId: variant._id,
      variantTitle: variantTitle,
    };

    try {
      const type = (product as any).pendingType || 'quick';
      await addToCart(productWithVariant, addButtonRef.current, type);
      setIsVariantSheetOpen(false);
      setSelectedVariantIndex(null);
      (product as any).pendingType = undefined;
    } catch (err) {
      console.error("Failed to add variant to cart", err);
    }
  };

  const handleDecrease = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Prevent any operation while another is in progress
    if (isOperationPendingRef.current || inCartQty <= 0) {
      return;
    }

    isOperationPendingRef.current = true;
    try {
      await updateQuantity(((product as any).id || product._id) as string, inCartQty - 1, cartItem?.variant);
    } finally {
      // Reset the flag after the operation truly completes
      isOperationPendingRef.current = false;
    }
  };

  const handleIncrease = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Prevent any operation while another is in progress
    if (isOperationPendingRef.current) {
      return;
    }

    isOperationPendingRef.current = true;

    try {
      if (inCartQty > 0) {
        await updateQuantity(((product as any).id || product._id) as string, inCartQty + 1, cartItem?.variant);
      } else {
        await addToCart(product, addButtonRef.current);
      }
    } finally {
      // Reset the flag after the operation truly completes
      isOperationPendingRef.current = false;
    }
  };

  // Distance-based delivery logic
  const sellerDistance = (product as any).distance || (product.seller as any)?.distance || 10; // Default to 10 if unknown
  const isQuickAvailable = sellerDistance <= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden flex flex-col relative"
    >
      <div
        onClick={handleCardClick}
        className="cursor-pointer flex-1 flex flex-col"
      >
        <div className={`w-full ${categoryStyle ? 'h-24 md:h-32' : 'h-32 md:h-40'} bg-neutral-50 flex items-center justify-center overflow-hidden relative`}>
          {product.imageUrl || product.mainImage ? (
            <img
              ref={imageRef}
              src={product.imageUrl || product.mainImage}
              alt={product.name || product.productName || 'Product'}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-50 text-neutral-300 text-2xl">
              {(product.name || product.productName || '?').charAt(0).toUpperCase()}
            </div>
          )}

          {/* Compact Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-1.5 left-1.5 z-10 bg-indigo-600 text-white text-[8px] md:text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm uppercase tracking-tighter">
              {discount}% OFF
            </div>
          )}

          {/* Heart Icon (Small) */}
          {showHeartIcon && (
            <button
              onClick={toggleWishlist}
              className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm border border-neutral-100"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isWishlisted ? "#ef4444" : "none"} stroke={isWishlisted ? "#ef4444" : "currentColor"} className="text-neutral-400">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        <div className="p-2 md:p-3 flex-1 flex flex-col">
          {/* Delivery Logic Badge */}
          <div className="flex items-center gap-1 mb-1">
            {isQuickAvailable ? (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-100 rounded-md">
                <span className="text-[7px] md:text-[8px] font-black text-yellow-700 uppercase tracking-tighter flex items-center gap-0.5">
                  ⚡ Quick
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 rounded-md">
                <span className="text-[7px] md:text-[8px] font-black text-blue-600 uppercase tracking-tighter">
                  📦 Standard
                </span>
              </div>
            )}
          </div>

          <h3 className="text-[11px] md:text-[13px] font-bold text-neutral-900 mb-0.5 line-clamp-1 leading-tight">
            {product.name || product.productName || ''}
          </h3>

          <div className="flex items-center justify-between mt-auto pt-1">
            <div className="flex flex-col">
              {/* Seller Name */}
              {(product.seller?.storeName || (product.seller as any)?.name) && (
                <span className="text-[8px] text-indigo-500 font-bold uppercase tracking-tight mb-0.5">
                  Sold by: {product.seller?.storeName || (product.seller as any)?.name}
                </span>
              )}
              <div className="flex items-center gap-1">
                <span className="text-[13px] md:text-[15px] font-black text-neutral-900">
                  ₹{displayPrice}
                </span>
                {mrp && mrp > displayPrice && (
                  <span className="text-[9px] md:text-[10px] text-neutral-400 line-through">
                    ₹{mrp}
                  </span>
                )}
              </div>
              {(product.pack || product.variations?.[0]?.title) && (
                <span className="text-[9px] text-neutral-400 font-medium">
                  {product.pack || product.variations?.[0]?.title || product.variations?.[0]?.value}
                </span>
              )}
              {product.variations && product.variations.length > 1 && (
                <span className="text-[8px] font-black text-indigo-600 uppercase tracking-tighter mt-0.5">
                  {product.variations.length} Options
                </span>
              )}
            </div>

            {/* Compact Add Button */}
            {inCartQty === 0 ? (
              <Button
                ref={addButtonRef}
                variant="outline"
                size="sm"
                disabled={((product.stock !== undefined && product.stock <= 0) || product.status === "Sold out")}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddType(e, isQuickAvailable ? 'quick' : 'ecommerce');
                }}
                className="border-neutral-200 text-neutral-900 bg-white font-black text-[9px] md:text-[10px] h-7 px-3 rounded-lg hover:bg-neutral-50 shadow-sm transition-all"
              >
                {((product.stock !== undefined && product.stock <= 0) || product.status === "Sold out") ? 'SOLD' : 'ADD'}
              </Button>
            ) : (
              <div className="flex items-center bg-indigo-600 rounded-lg h-7 px-1 shadow-sm">
                <button
                  onClick={handleDecrease}
                  className="w-5 h-5 flex items-center justify-center text-white font-black"
                >
                  −
                </button>
                <span className="text-[10px] font-black text-white min-w-[1.2rem] text-center">
                  {inCartQty}
                </span>
                <button
                  onClick={handleIncrease}
                  className="w-5 h-5 flex items-center justify-center text-white font-black"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


      {!categoryStyle && (
        <div className={`${compact ? 'px-3 pb-3' : 'px-4 pb-4'}`}>
          <div className="mt-auto">
            {inCartQty === 0 ? (
              <div>
                <Button
                  ref={addButtonRef}
                  variant="outline"
                  size="sm"
                  disabled={((product.stock !== undefined && product.stock <= 0) || product.status === "Sold out")}
                  onClick={handleAdd}
                  className={`w-full border h-8 text-xs font-semibold uppercase tracking-wide ${((product.stock !== undefined && product.stock <= 0) || product.status === "Sold out")
                    ? 'border-neutral-300 text-neutral-400 bg-neutral-50 cursor-not-allowed'
                    : 'border-primary-dark text-primary-dark hover:bg-yellow-50'
                    }`}
                >
                  {((product.stock !== undefined && product.stock <= 0) || product.status === "Sold out") ? 'Out of Stock' : 'Add'}
                </Button>
                <div className="h-4 mt-1">
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 bg-white border border-primary-dark rounded-full px-2 py-0.5 h-8">
                <Button
                  variant="default"
                  size="icon"
                  onClick={handleDecrease}
                  className="w-6 h-6 p-0 bg-transparent text-primary-dark hover:bg-yellow-50 shadow-none"
                  aria-label="Decrease quantity"
                >
                  −
                </Button>
                <span className="text-xs font-bold text-primary-dark min-w-[1.5rem] text-center">
                  {inCartQty}
                </span>
                <Button
                  variant="default"
                  size="icon"
                  onClick={handleIncrease}
                  className={`w-6 h-6 p-0 bg-transparent text-primary-dark hover:bg-yellow-50 shadow-none`}
                  aria-label="Increase quantity"
                >
                  +
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Variant Selection Sheet */}
      <Sheet open={isVariantSheetOpen} onOpenChange={setIsVariantSheetOpen}>
        <SheetContent side="bottom" className="h-auto pb-8 rounded-t-[32px]">
          <SheetHeader className="pb-4">
            <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-4" />
            <SheetTitle className="text-center text-lg font-bold">Select Option</SheetTitle>
          </SheetHeader>
          
          <div className="px-6 space-y-6">
            <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-2xl">
              <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-neutral-100 flex-shrink-0">
                <img src={product.imageUrl || product.mainImage} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 line-clamp-1">{product.name || product.productName}</h4>
                <p className="text-xs text-neutral-500 mt-0.5">Choose your preferred size/variant</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Available Options</p>
              <div className="grid grid-cols-1 gap-2">
                {product.variations?.map((variant, index) => {
                  const title = variant.title || variant.value || variant.name;
                  const isOutOfStock = variant.stock === 0;
                  const price = variant.price || product.price;
                  
                  return (
                    <button
                      key={index}
                      disabled={isOutOfStock}
                      onClick={() => handleVariantSelect(index)}
                      className="flex items-center justify-between p-4 rounded-2xl border-2 border-neutral-100 hover:border-primary-dark hover:bg-yellow-50/30 transition-all group disabled:opacity-50 disabled:hover:border-neutral-100 disabled:hover:bg-transparent"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-neutral-900 group-hover:text-primary-dark transition-colors">{title}</span>
                        {isOutOfStock && <span className="text-[10px] text-red-500 font-bold uppercase mt-0.5">Sold Out</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-neutral-900">₹{price}</span>
                        <div className="w-6 h-6 rounded-full border-2 border-neutral-200 group-hover:border-primary-dark group-hover:bg-primary-dark flex items-center justify-center transition-all">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" className="opacity-0 group-hover:opacity-100">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
