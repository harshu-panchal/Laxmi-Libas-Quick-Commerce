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
  // Global check to hide mock/placeholder products (like the 'jeans' 200/50 card or truck icon)
  const isMockProduct = 
    ((product.name?.toLowerCase() === 'jeans' || (product as any).productName?.toLowerCase() === 'jeans') && 
     (Number(product.price) === 200 || Number(product.price) === 50 || Number((product as any).originalPrice) === 200)) ||
    ((product.imageUrl || "").includes('10mins_icon_pink') || (product.mainImage || "").includes('10mins_icon_pink') || 
     (product.imageUrl || "").includes('truck') || (product.mainImage || "").includes('truck'));

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col relative"
    >
      <div
        onClick={handleCardClick}
        className="cursor-pointer flex-1 flex flex-col"
      >
        <div className={`w-full ${compact ? 'h-32 md:h-40' : categoryStyle ? 'h-28 md:h-36' : 'h-40 md:h-48'} bg-neutral-100 flex items-center justify-center overflow-hidden relative`}>
          {product.imageUrl || product.mainImage ? (
            <img
              ref={imageRef}
              src={product.imageUrl || product.mainImage}
              alt={product.name || product.productName || 'Product'}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Hide broken image and show fallback
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.fallback-icon')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400 text-4xl fallback-icon';
                  fallback.textContent = (product.name || product.productName || '?').charAt(0).toUpperCase();
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400 text-4xl">
              {(product.name || product.productName || '?').charAt(0).toUpperCase()}
            </div>
          )}

          {categoryStyle && showBadge && discount > 0 && (
            <div className="absolute top-2 left-2 z-10 bg-primary-dark text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              {discount}% off
            </div>
          )}

          {!categoryStyle && showBadge && (badgeText || discount > 0) && (
            <Badge
              variant="destructive"
              className="absolute top-2 left-2 z-10 text-xs px-2 py-1"
            >
              {badgeText || `${discount}% OFF`}
            </Badge>
          )}

          {showPackBadge && (
            <Badge
              variant="outline"
              className="absolute top-2 right-2 z-10 text-xs px-2 py-1 font-medium"
            >
              {product.variations?.[0]?.value || product.pack}
            </Badge>
          )}

          {showHeartIcon && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(e);
              }}
              className="absolute top-2 right-2 z-30 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-md group/heart"
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={isWishlisted ? "#ef4444" : "none"}
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-colors ${isWishlisted ? "text-red-500" : "text-neutral-400 group-hover/heart:text-red-400"}`}
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {(product.variations?.length || 0) >= 2 && (
            <div className="absolute bottom-2 left-2 z-10">
              <span className="text-[10px] font-bold text-neutral-700 bg-white/95 backdrop-blur-sm px-2 py-1 rounded shadow-sm border border-neutral-200">
                {product.variations?.length} Options
              </span>
            </div>
          )}
        </div>

        {categoryStyle && (
          <div className="px-2.5 pt-1.5 pb-0">
            {inCartQty === 0 ? (
              <div className="flex flex-col items-center w-full">
                <div className="flex justify-center w-full">
                  <Button
                    ref={addButtonRef}
                    variant="outline"
                    size="sm"
                    disabled={((product.stock !== undefined && product.stock <= 0) || product.status === "Sold out")}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdd(e);
                    }}
                    className={`w-full border rounded-full font-semibold text-xs h-7 px-3 flex items-center justify-center uppercase tracking-wide ${((product.stock !== undefined && product.stock <= 0) || product.status === "Sold out")
                      ? 'border-neutral-300 text-neutral-400 bg-neutral-50 cursor-not-allowed'
                      : 'border-primary-dark text-primary-dark bg-transparent hover:bg-yellow-50'
                      }`}
                  >
                    {((product.stock !== undefined && product.stock <= 0) || product.status === "Sold out") ? 'Out of Stock' : 'ADD'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 bg-white border border-primary-dark rounded-full px-1.5 py-0.5 h-7 w-full">
                <Button
                  variant="default"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDecrease(e);
                  }}
                  className="w-5 h-5 p-0 bg-transparent text-primary-dark hover:bg-yellow-50 shadow-none"
                  aria-label="Decrease quantity"
                >
                  −
                </Button>
                <span className="text-xs font-bold text-primary-dark min-w-[1rem] text-center">
                  {inCartQty}
                </span>
                <Button
                  variant="default"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleIncrease(e);
                  }}
                  className={`w-5 h-5 p-0 bg-transparent text-primary-dark shadow-none hover:bg-yellow-50`}
                  aria-label="Increase quantity"
                >
                  +
                </Button>
              </div>
            )}
          </div>
        )}

        <div className={`${compact ? 'p-3 md:p-4' : categoryStyle ? 'px-2.5 md:px-3 pt-1.5 md:pt-2 pb-2 md:pb-3' : 'p-4 md:p-5'} flex-1 flex flex-col`}>
          {categoryStyle ? (
            // Category Style Layout: Quantity, Name, Time, % off, Price
            <>
              {/* 1. Quantity */}
              {!showPackBadge && (product.pack || product.variations?.[0]?.value) && (
                <p className="text-[9px] text-neutral-600 mb-0.5 leading-tight">
                  {product.variations?.[0]?.value || product.pack}
                </p>
              )}

              {/* 2. Name */}
              <h3 className="text-[10px] font-bold text-neutral-900 mb-0.5 line-clamp-2 leading-tight min-h-[1.75rem] max-h-[1.75rem] overflow-hidden">
                {product.name || product.productName || ''}
              </h3>

              {/* 2.5. Rating */}
              <div className="mb-0.5">
                <StarRating
                  rating={(product.rating || (product as any).rating) || 0}
                  reviewCount={(product.reviews || (product as any).reviewsCount) || 0}
                  size="sm"
                  showCount={true}
                />
              </div>

              {/* 3. Time */}
              {/* Delivery time removed as per user request */}

              {/* 4. % OFF */}
              {discount > 0 && (
                <p className="text-[9px] font-semibold text-primary-dark mb-0.5 leading-tight">
                  {discount}% OFF
                </p>
              )}

              {/* 5. Price & Hybrid Delivery Options */}
              <div className="mt-auto space-y-2">
                {/* Hybrid Delivery Selection Buttons */}
                <div className="grid grid-cols-1 gap-1.5">
                  {(product as any).nearbyAvailable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddType(e, 'quick');
                      }}
                      className="flex items-center justify-between px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-lg hover:border-primary-dark transition-colors group/quick"
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-[8px] font-bold text-primary-dark uppercase flex items-center gap-0.5">
                          ⚡ Quick
                        </span>
                        <span className="text-[8px] text-neutral-500">{(product as any).deliveryTimeQuick || '30 min'}</span>
                      </div>
                      <span className="text-[10px] font-black text-neutral-900 group-hover/quick:text-primary-dark">
                        ₹{(product as any).quickPrice || displayPrice}
                      </span>
                    </button>
                  )}

                  {(product as any).ecommerceAvailable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddType(e, 'ecommerce');
                      }}
                      className="flex items-center justify-between px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg hover:border-blue-500 transition-colors group/ecom"
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-[8px] font-bold text-blue-600 uppercase flex items-center gap-0.5">
                          📦 Courier
                        </span>
                        <span className="text-[8px] text-neutral-500">{(product as any).deliveryTimeEcommerce || '3-5 days'}</span>
                      </div>
                      <span className="text-[10px] font-black text-neutral-900 group-hover/ecom:text-blue-600">
                        ₹{(product as any).ecommercePrice || displayPrice}
                      </span>
                    </button>
                  )}

                  {!(product as any).nearbyAvailable && !(product as any).ecommerceAvailable && (
                    <div className="text-[9px] text-red-500 font-medium py-1 px-2 bg-red-50 rounded-lg border border-red-100 italic">
                      Not available at your location
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Non-category style layout (original)
            <>
              {!showPackBadge && (
                <p className={`${compact ? 'text-[10px] md:text-xs' : 'text-xs md:text-sm'} text-neutral-500 mb-1`}>
                  {product.variations?.[0]?.value || product.pack}
                </p>
              )}

              <h3 className={`${compact ? 'text-xs md:text-sm' : 'text-sm md:text-base'} font-semibold text-neutral-900 ${compact ? 'mb-1' : 'mb-2'} line-clamp-2 ${compact ? 'min-h-[2rem]' : 'min-h-[2.5rem]'}`}>
                {product.name || product.productName || ''}
              </h3>

              {/* Always show rating */}
              <div className={`${compact ? 'mb-1' : 'mb-2'}`}>
                <StarRating
                  rating={(product.rating || (product as any).rating) || 0}
                  reviewCount={(product.reviews || (product as any).reviewsCount) || 0}
                  size={compact ? 'sm' : 'md'}
                  showCount={true}
                />
              </div>

              {showStockInfo && (
                <p className="text-xs text-primary-dark mb-2 font-medium">
                  Fast delivery
                </p>
              )}

              {showVegetarianIcon && (
                <div className="flex items-center gap-1 mb-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-xs text-neutral-600">Vegetarian</span>
                </div>
              )}

              <div className="mt-auto mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-base font-bold text-neutral-900">
                    ₹{displayPrice}
                  </span>
                  {mrp && mrp > displayPrice && (
                    <span className="text-xs text-neutral-500 line-through">
                      ₹{mrp}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
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
