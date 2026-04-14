import {
  useParams,
  useNavigate,
  useLocation as useRouterLocation,
} from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
// import { products } from '../../data/products'; // REMOVED
// import { categories } from '../../data/categories'; // REMOVED
import { useCart } from "../../context/CartContext";
import { useLocation } from "../../hooks/useLocation";
import { useLoading } from "../../context/LoadingContext";
import { useToast } from "../../context/ToastContext";
import Button from "../../components/ui/button";
import Badge from "../../components/ui/badge";
import { getProductById } from "../../services/api/customerProductService";
import WishlistButton from "../../components/WishlistButton";
import StarRating from "../../components/ui/StarRating";
import { calculateProductPrice } from "../../utils/priceUtils";
import { CLOTHING_MOCK_DATA } from "../../utils/clothingMockData";
import { useShare } from "../../hooks/useShare";
import ShareSheet from "../../components/ShareSheet";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const { cart, addToCart, updateQuantity } = useCart();
  const { location } = useLocation();
  const { startLoading, stopLoading } = useLoading();
  const { showToast } = useToast();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [isProductDetailsExpanded, setIsProductDetailsExpanded] =
    useState(false);
  const [isHighlightsExpanded, setIsHighlightsExpanded] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  const [product, setProduct] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAvailableAtLocation, setIsAvailableAtLocation] =
    useState<boolean>(true);

  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Sharing hook
  const {
    share,
    isShareSheetOpen,
    shareData,
    closeShareSheet,
    copyToClipboard
  } = useShare();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      startLoading();

      // Handle mock products
      if (id?.startsWith("mock-p")) {
        const mockProduct = CLOTHING_MOCK_DATA.products.find(
          (p) => p._id === id,
        );
        if (mockProduct) {
          setProduct({
            ...mockProduct,
            id: mockProduct._id,
            allImages: mockProduct.images,
            imageUrl: mockProduct.images[0],
            mrp: mockProduct.price,
            pack: "Standard",
          });
          setSimilarProducts(
            CLOTHING_MOCK_DATA.products.filter((p) => p._id !== id),
          );
          setLoading(false);
          stopLoading();
          return;
        }
      }

      try {
        // Check if navigation came from store page
        const fromStore = (routerLocation.state as any)?.fromStore === true;

        // Fetch product details with location
        const response = await getProductById(
          id,
          location?.latitude,
          location?.longitude,
        );
        if (response.success && response.data) {
          const productData = response.data as any;

          // Set location availability flag - Always true as per user request
          setIsAvailableAtLocation(true);

          // Get all images (main + gallery)
          const allImages = [
            productData.mainImage || productData.imageUrl || "",
            ...(productData.galleryImages ||
              productData.galleryImageUrls ||
              []),
          ].filter(Boolean);

          setProduct({
            ...productData,
            // Ensure all critical fields have safe defaults
            id: productData._id || productData.id,
            name: productData.productName || productData.name || "Product",
            imageUrl: productData.mainImage || productData.imageUrl || "",
            allImages: allImages,
            price: productData.price || 0,
            mrp: productData.mrp || productData.price || 0,
            colorVariations: response.data.colorVariations || [], // NEW
            pack:
              productData.variations?.[0]?.title ||
              productData.variations?.[0]?.value ||
              productData.smallDescription ||
              "Standard",
          });

          // Filter out mock products from similar products
          const isMockProduct = (p: any) =>
            ((p.name?.toLowerCase() === "jeans" ||
              (p.productName || p.title || "").toLowerCase() === "jeans") &&
              (Number(p.price) === 200 ||
                Number(p.price) === 50 ||
                Number(p.originalPrice) === 200)) ||
            (p.imageUrl || "").includes("10mins_icon_pink") ||
            (p.mainImage || "").includes("10mins_icon_pink");

          const safeSimilarProducts = (
            response.data.similarProducts || []
          ).filter((p: any) => !isMockProduct(p));

          setSimilarProducts(safeSimilarProducts);
        } else {
          setProduct(null);
          setError(response.message || "Product not found");
        }
      } catch (error: any) {
        console.error("Failed to fetch product", error);
        setProduct(null);
        setError(
          error.message ||
          "Something went wrong while fetching product details",
        );
      } finally {
        setLoading(false);
        stopLoading();
      }
    };

    fetchProduct();
  }, [id, location?.latitude, location?.longitude]);

  // Reset selected variant and image when product changes (color switch)
  useEffect(() => {
    setSelectedVariantIndex(0);
    setSelectedImageIndex(0);
  }, [id]);

  // Get selected variant
  const selectedVariant = product?.variations?.[selectedVariantIndex] || null;
  const {
    displayPrice: variantPrice,
    mrp: variantMrp,
    discount,
    hasDiscount,
  } = calculateProductPrice(product, selectedVariantIndex);

  const variantStock =
    selectedVariant?.stock !== undefined
      ? selectedVariant.stock
      : product?.stock || 0;
  const variantTitle =
    selectedVariant?.title ||
    selectedVariant?.value ||
    product?.pack ||
    "Standard";
  const isVariantAvailable =
    selectedVariant?.status !== "Sold out" && variantStock > 0;

  // Get all images for gallery
  const allImages =
    product?.allImages || [product?.imageUrl || ""].filter(Boolean);
  const currentImage = allImages[selectedImageIndex] || product?.imageUrl || "";

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  // Handle touch start
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  // Handle touch move
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  // Handle touch end - perform swipe
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && selectedImageIndex < allImages.length - 1) {
      setIsTransitioning(true);
      setSelectedImageIndex(selectedImageIndex + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }

    if (isRightSwipe && selectedImageIndex > 0) {
      setIsTransitioning(true);
      setSelectedImageIndex(selectedImageIndex - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  // Get quantity in cart - check by product ID and variant if available
  const cartItem = product
    ? cart.items.find((item) => {
      if (!item?.product) return false;
      const itemProductId = String(item.product.id || item.product._id);
      const productId = String(product.id || product._id);

      if (itemProductId !== productId) return false;

      // Normalize titles for comparison (remove whitespace, lowercase)
      const normalize = (s: any) =>
        String(s || "")
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "");
      const currentVariantTitle = normalize(variantTitle);

      // If variant exists in current view, match by variant
      if (selectedVariant) {
        const itemVariantId =
          (item.product as any).variantId ||
          (item.product as any).selectedVariant?._id;
        const itemVariantTitle = normalize(
          (item.product as any).variantTitle ||
          (item.product as any).pack ||
          item.variant,
        );

        const selectedVariantId = String(selectedVariant._id || "");

        // Match by ID if available
        if (
          itemVariantId &&
          selectedVariantId &&
          String(itemVariantId) === selectedVariantId
        ) {
          return true;
        }

        // Fallback to Title match
        return itemVariantTitle === currentVariantTitle;
      }

      // If no variant in current view, match items that also have no variant info
      const itemVariantId =
        (item.product as any).variantId ||
        (item.product as any).selectedVariant?._id;
      const itemVariantTitle = (item.product as any).variantTitle;

      // If the item in cart HAS a variant but we don't have variants here, it's still the same product
      // and we might want to show it as "In Cart" (at least in summary).
      // For ProductDetail, if there's ONLY one type of item for this product, match it.
      return !itemVariantId && !itemVariantTitle;
    })
    : null;
  const inCartQty = cartItem?.quantity || 0;

  if (loading && !product) {
    return null; // Let the global IconLoader handle this
  }

  if (error && !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center bg-white">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Oops! Something went wrong
        </h3>
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

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4 md:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-lg md:text-xl font-semibold text-neutral-900 mb-4">
            Product not found
          </p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Get category info - safe access
  const category =
    product.category && product.category.name
      ? { name: product.category.name, id: product.category._id }
      : null;

  const handleAddToCart = () => {
    // Location check removed as per user request

    if (!isVariantAvailable && variantStock !== 0) {
      alert("This variant is currently out of stock.");
      return;
    }
    // Create product with selected variant info
    const productWithVariant = {
      ...product,
      price: variantPrice,
      mrp: variantMrp,
      pack: variantTitle,
      selectedVariant: selectedVariant,
      variantId: selectedVariant?._id,
      variantTitle: variantTitle,
    };
    addToCart(productWithVariant, addButtonRef.current);
  };

  // WhatsApp Enquiry Logic for Room Rent
  const isRoomRent =
    category?.name?.toLowerCase().includes("room") ||
    category?.name?.toLowerCase().includes("rent") ||
    product?.category?.name?.toLowerCase().includes("room") ||
    product?.category?.name?.toLowerCase().includes("rent");

  const handleWhatsAppEnquiry = () => {
    // Priority: 1. Category specific contact number, 2. Populated seller mobile, 3. Hardcoded test number
    const sellerMobile =
      (product as any).contactNumber ||
      product.seller?.mobile ||
      (product as any).sellerMobile ||
      "9111966732";

    const message = `Hello, I am interested in your listing: ${product.name}. Can you provide more details? \n\nLink: ${window.location.href}`;
    const whatsappUrl = `https://wa.me/${sellerMobile.startsWith("91") ? sellerMobile : "91" + sellerMobile
      }?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleBuyNow = async () => {
    // Add to cart first
    await handleAddToCart();
    // Then navigate to checkout
    navigate("/checkout");
  };

  const handleShare = () => {
    if (!product) return;

    share({
      title: product.name,
      text: product.smallDescription || `Check out this ${product.name} on Laxmart!`,
      url: window.location.href,
    });
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header with back button and action icons */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-3 md:py-4">
          {/* Back button - top left */}
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-neutral-50 transition-colors"
            aria-label="Go back"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Action icons - top right */}
          <div className="flex items-center gap-2">
            {/* Share button */}
            <button
              onClick={handleShare}
              className="w-9 h-9 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all text-neutral-400 hover:text-neutral-600"
              aria-label="Share product"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>

            {/* Heart icon */}
            {product?.id && (
              <WishlistButton
                productId={product.id}
                size="md"
                position="relative"
                className="bg-white rounded-full shadow-sm"
              />
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="pt-16">
        {/* Product Image Gallery */}
        <div className="relative w-full bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden">
          {/* Main Product Image - Swipeable on mobile */}
          <div
            className="w-full aspect-square relative overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              touchAction: allImages.length > 1 ? "pan-x" : "pan-y pinch-zoom",
              cursor: allImages.length > 1 ? "grab" : "default",
            }}
          >
            {/* Image Container with swipe animation - Mobile swipe carousel */}
            <div
              className="w-full h-full flex transition-transform duration-300 ease-out md:hidden"
              style={{
                transform: `translateX(-${selectedImageIndex * 100}%)`,
              }}
            >
              {allImages.map((image: string, index: number) => (
                <div
                  key={index}
                  className="w-full h-full flex-shrink-0 flex items-center justify-center relative"
                  style={{ minWidth: "100%" }}
                >
                  {image ? (
                    <img
                      src={image}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-6xl">
                      {(product.name || product.productName || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: Single image display */}
            <div className="hidden md:flex w-full h-full items-center justify-center">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400 text-6xl">
                  {(product.name || product.productName || "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>

            {/* Image Gallery Navigation - Only show if multiple images */}
            {allImages.length > 1 && (
              <>
                {/* Previous Image Button - Desktop only */}
                {selectedImageIndex > 0 && (
                  <button
                    onClick={() => {
                      setIsTransitioning(true);
                      setSelectedImageIndex(selectedImageIndex - 1);
                      setTimeout(() => setIsTransitioning(false), 300);
                    }}
                    className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full items-center justify-center shadow-md hover:bg-white transition-colors z-10"
                    aria-label="Previous image"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15 18l-6-6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}

                {/* Next Image Button - Desktop only */}
                {selectedImageIndex < allImages.length - 1 && (
                  <button
                    onClick={() => {
                      setIsTransitioning(true);
                      setSelectedImageIndex(selectedImageIndex + 1);
                      setTimeout(() => setIsTransitioning(false), 300);
                    }}
                    className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full items-center justify-center shadow-md hover:bg-white transition-colors z-10"
                    aria-label="Next image"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 18l6-6-6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}

                {/* Image Indicators - Show on both mobile and desktop */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {allImages.map((_: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => {
                        setIsTransitioning(true);
                        setSelectedImageIndex(index);
                        setTimeout(() => setIsTransitioning(false), 300);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${index === selectedImageIndex
                          ? "bg-white w-6"
                          : "bg-white/50 hover:bg-white/75"
                        }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail Gallery - Show below main image if multiple images */}
          {allImages.length > 1 && (
            <div className="px-4 py-2 bg-white/50 backdrop-blur-sm mb-4">
              {/* Mobile swipe hint */}
              <div className="md:hidden flex items-center justify-center gap-1 mb-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-neutral-500"
                >
                  <path
                    d="M7 12l5-5M17 12l-5-5M12 7l-5 5M12 17l5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs text-neutral-500">
                  Swipe to view more
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 scroll-smooth">
                {allImages.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsTransitioning(true);
                      setSelectedImageIndex(index);
                      setTimeout(() => setIsTransitioning(false), 300);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === selectedImageIndex
                        ? "border-primary-dark ring-2 ring-yellow-200"
                        : "border-neutral-200 hover:border-neutral-300"
                      }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Product Details Card - White section */}
        <div className="bg-white rounded-t-3xl -mt-6 relative z-10 px-4 md:px-6 lg:px-8 pt-2.5 md:pt-4 pb-2 md:pb-4">
          {/* Delivery time */}
          {/* Delivery time removed as per user request */}

          {/* Product name */}
          <h2 className="text-lg md:text-2xl font-bold text-neutral-900 mb-1 leading-tight">
            {product.name}
          </h2>

          {/* Color Variations Section - Thumbnails like Flipkart */}
          {((product.colorVariations && product.colorVariations.length > 0) || product.color) && (
            <div className="mb-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-neutral-900">
                  Selected Color: <span className="text-neutral-500 font-normal">{product.color || "Default"}</span>
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide py-1">
                {/* Current Product Thumbnail */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-20 rounded-lg overflow-hidden border-2 border-primary-dark ring-2 ring-yellow-100">
                    <img
                      src={product.imageUrl}
                      alt="Current color"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Other Color Thumbnails */}
                {product.colorVariations?.map((variant: any) => (
                  <button
                    key={variant._id}
                    onClick={() => navigate(`/product/${variant._id}`)}
                    className="relative flex-shrink-0 group"
                  >
                    <div className="w-16 h-20 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-neutral-300 transition-all">
                      <img
                        src={variant.mainImage || variant.imageUrl}
                        alt={variant.color}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Variations Section - Buttons like Flipkart */}
          {product.variations && product.variations.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-neutral-900">
                  Selected Size: <span className="bg-neutral-100 px-2 py-0.5 rounded text-xs ml-1">{variantTitle}</span>
                </span>
                <button className="text-primary-dark text-xs font-bold hover:underline">
                  Size Chart
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.variations.map((variant: any, index: number) => {
                  const title = variant.title || variant.value || variant.name;
                  const isSelected = selectedVariantIndex === index;
                  const isOutOfStock = variant.stock === 0;

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedVariantIndex(index)}
                      disabled={isOutOfStock}
                      className={`
                        min-w-[48px] h-12 px-3 rounded-xl flex items-center justify-center font-bold text-sm transition-all border-2
                        ${isSelected
                          ? "border-primary-dark bg-white text-neutral-900 shadow-sm"
                          : isOutOfStock
                            ? "border-dashed border-neutral-200 bg-neutral-50 text-neutral-300 cursor-not-allowed italic"
                            : "border-neutral-100 bg-neutral-50 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-100"
                        }
                      `}
                    >
                      {title}
                      {isSelected && (
                        <div className="absolute top-0 right-0 -mr-1 -mt-1 w-4 h-4 bg-primary-dark rounded-full flex items-center justify-center border-2 border-white">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity/Pack */}
          <p className="text-sm md:text-base text-neutral-600 mb-1">
            {variantTitle}
          </p>

          {/* Price section */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xl font-bold text-neutral-900">
              ₹{variantPrice.toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <>
                <span className="text-sm text-neutral-500 line-through">
                  ₹{variantMrp.toLocaleString("en-IN")}
                </span>
                {discount > 0 && (
                  <Badge className="!bg-blue-500 !text-white !border-blue-500 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                    {discount}% OFF
                  </Badge>
                )}
              </>
            )}
          </div>

          {/* Stock Status */}
          {variantStock !== 0 &&
            variantStock !== undefined &&
            variantStock !== null && (
              <p className="text-sm text-neutral-600 mb-1">
                {variantStock > 0 ? `${variantStock} in stock` : "Out of stock"}
              </p>
            )}

          {/* Divider line */}
          <div className="border-t border-neutral-200 mb-1.5"></div>

          {/* View product details link */}
          <button
            onClick={() =>
              setIsProductDetailsExpanded(!isProductDetailsExpanded)
            }
            className="flex items-center gap-0.5 text-sm text-primary-dark font-medium"
          >
            View product details
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transition-transform ${isProductDetailsExpanded ? "rotate-180" : ""
                }`}
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Expanded Product Details Section */}
        {isProductDetailsExpanded && (
          <div className="mt-1.5">
            {/* Service Guarantees Card */}
            <div className="bg-white rounded-lg p-3 mb-2">
              <div className="grid grid-cols-3 gap-2">
                {/* Replacement */}
                <div className="flex flex-col items-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mb-1"
                  >
                    <path
                      d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3M20.49 15a9 9 0 0 1-14.85 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-sm font-bold text-neutral-900">
                    48 hours
                  </span>
                  <span className="text-xs text-neutral-600">Replacement</span>
                </div>

                {/* Support */}
                <div className="flex flex-col items-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mb-1"
                  >
                    <path
                      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M13 8H7M17 12H7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-sm font-bold text-neutral-900">
                    24/7
                  </span>
                  <span className="text-xs text-neutral-600">Support</span>
                </div>

                {/* Delivery */}
                <div className="flex flex-col items-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mb-1"
                  >
                    <path
                      d="M5 17H2l1-7h18l1 7h-3M5 17l-1-5h20l-1 5M5 17v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5M9 22h6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-sm font-bold text-neutral-900">
                    Fast
                  </span>
                  <span className="text-xs text-neutral-600">Delivery</span>
                </div>
              </div>
            </div>

            {/* Highlights Section */}
            <div className="bg-neutral-100 rounded-lg mb-2 overflow-hidden">
              <button
                onClick={() => setIsHighlightsExpanded(!isHighlightsExpanded)}
                className="w-full px-2 py-2.5 flex items-center justify-between bg-neutral-100"
              >
                <span className="text-sm font-semibold text-neutral-700">
                  Highlights
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`transition-transform ${isHighlightsExpanded ? "rotate-180" : ""
                    }`}
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {isHighlightsExpanded && (
                <div className="bg-white px-2 py-2">
                  <div className="space-y-1.5">
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex items-start">
                        <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                          Key Features:
                        </span>
                        <span className="text-xs text-neutral-600">
                          {product.tags.map((tag: string, index: number) => (
                            <span key={tag}>
                              {tag
                                .replace(/-/g, " ")
                                .split(" ")
                                .map(
                                  (word: string) =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1),
                                )
                                .join(" ")}
                              {index < (product.tags?.length || 0) - 1
                                ? ", "
                                : ""}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start">
                      <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                        Source:
                      </span>
                      <span className="text-xs text-neutral-600">
                        {product.madeIn || "From India"}
                      </span>
                    </div>
                    {category && (
                      <div className="flex items-start">
                        <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                          Category:
                        </span>
                        <span className="text-xs text-neutral-600">
                          {category.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="bg-neutral-100 rounded-lg overflow-hidden">
              <button
                onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                className="w-full px-2 py-2.5 flex items-center justify-between bg-neutral-100"
              >
                <span className="text-sm font-semibold text-neutral-700">
                  Info
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`transition-transform ${isInfoExpanded ? "rotate-180" : ""
                    }`}
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {isInfoExpanded && (
                <div className="bg-white px-2 py-2">
                  <div className="space-y-1.5">
                    {product.description && (
                      <div className="flex items-start">
                        <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                          Description:
                        </span>
                        <span className="text-xs text-neutral-600 leading-relaxed flex-1">
                          {product.description}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start">
                      <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                        Unit:
                      </span>
                      <span className="text-xs text-neutral-600">
                        {product.pack}
                      </span>
                    </div>
                    {product.fssaiLicNo && (
                      <div className="flex items-start">
                        <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                          FSSAI License:
                        </span>
                        <span className="text-xs text-neutral-600">
                          {product.fssaiLicNo}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start">
                      <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                        Shelf Life:
                      </span>
                      <span className="text-xs text-neutral-600">
                        Refer to package
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                        Disclaimer:
                      </span>
                      <span className="text-xs text-neutral-600 leading-relaxed flex-1">
                        Every effort is made to maintain accuracy of all
                        Information. However, actual product packaging and
                        materials may contain more and/or different information.
                        It is recommended not to solely rely on the information
                        presented.
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                        Customer Care Details:
                      </span>
                      <span className="text-xs text-neutral-600">
                        Email: help@laxmart.com
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                        Country of Origin:
                      </span>
                      <span className="text-xs text-neutral-600">
                        {product.madeIn || "India"}
                      </span>
                    </div>
                    {product.manufacturer && (
                      <div className="flex items-start">
                        <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                          Manufacturer:
                        </span>
                        <span className="text-xs text-neutral-600 leading-relaxed flex-1">
                          {product.manufacturer}
                        </span>
                      </div>
                    )}
                    {/* Marketer same as manufacturer if not present, or hidden */}

                    <div className="flex items-start">
                      <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                        Return Policy:
                      </span>
                      <span className="text-xs text-neutral-600 leading-relaxed flex-1">
                        {product.isReturnable
                          ? `This product is returnable within ${product.maxReturnDays || 2
                          } days.`
                          : "This product is non-returnable."}
                      </span>
                    </div>
                    {product.sellerId && (
                      <div className="flex items-start">
                        <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                          Seller:
                        </span>
                        <span className="text-xs text-neutral-600 leading-relaxed flex-1">
                          LaxMart Partner (
                          {product.sellerId.slice(-6).toUpperCase()})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top products in this category */}
        {similarProducts.length > 0 && (
          <div className="mt-6 mb-24">
            <div className="bg-neutral-100/50 border-t border-b border-neutral-200/50 py-4 px-3">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 px-1">
                Top products in this category
              </h3>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 px-1">
                {similarProducts.map((similarProduct) => {
                  const similarCartItem = cart.items.find(
                    (item) =>
                      item?.product &&
                      (item.product.id === similarProduct.id ||
                        item.product.id === similarProduct._id),
                  );
                  const similarInCartQty = similarCartItem?.quantity || 0;

                  return (
                    <div
                      key={similarProduct.id}
                      className="flex-shrink-0 w-40 bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden relative"
                    >
                      {/* Heart icon - top right */}
                      <WishlistButton
                        productId={similarProduct.id || similarProduct._id}
                        size="sm"
                        className="absolute top-2 right-2 shadow-md"
                      />

                      {/* Image */}
                      <div
                        onClick={() =>
                          navigate(
                            `/product/${similarProduct.id || similarProduct._id
                            }`,
                            { state: { fromStore: true } },
                          )
                        }
                        className="w-full h-32 bg-neutral-100 flex items-center justify-center overflow-hidden cursor-pointer"
                      >
                        {similarProduct.imageUrl || similarProduct.mainImage ? (
                          <img
                            src={
                              similarProduct.imageUrl ||
                              similarProduct.mainImage
                            }
                            alt={
                              similarProduct.name || similarProduct.productName
                            }
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400 text-2xl">
                            {(
                              similarProduct.name ||
                              similarProduct.productName ||
                              "P"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <h4 className="text-sm font-semibold text-neutral-900 mb-1 line-clamp-2 min-h-[2.5rem]">
                          {similarProduct.name || similarProduct.productName}
                        </h4>

                        {/* Rating and Delivery time */}
                        <div className="flex flex-col gap-1 mb-2">
                          <StarRating
                            rating={similarProduct.rating || 0}
                            reviewCount={similarProduct.reviews || 0}
                            size="sm"
                            showCount={true}
                          />
                          <p className="text-[10px] text-neutral-600 flex items-center gap-1">
                            <span className="text-primary-dark">
                              Bestseller
                            </span>
                          </p>
                        </div>

                        {/* Price display for similar products */}
                        <div className="mb-2">
                          {(() => {
                            const {
                              displayPrice,
                              mrp,
                              discount: sDiscount,
                              hasDiscount: sHasDiscount,
                            } = calculateProductPrice(similarProduct);
                            return (
                              <div className="flex flex-col">
                                {sHasDiscount && (
                                  <Badge className="!bg-blue-500 !text-white !border-blue-500 text-[10px] px-1.5 py-0.5 rounded-full font-semibold mb-1 w-fit">
                                    {sDiscount}% OFF
                                  </Badge>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-bold text-neutral-900">
                                    ₹{displayPrice.toLocaleString("en-IN")}
                                  </span>
                                  {sHasDiscount && (
                                    <span className="text-[10px] text-neutral-500 line-through">
                                      ₹{mrp.toLocaleString("en-IN")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* ADD button or Quantity stepper */}
                        <AnimatePresence mode="wait">
                          {similarInCartQty === 0 ? (
                            <motion.div
                              key="add-button"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.2 }}
                              className="flex justify-center w-full"
                            >
                              <Button
                                variant="outline"
                                size="default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(similarProduct);
                                }}
                                className="w-full border-2 border-primary-dark text-primary-dark bg-transparent hover:bg-yellow-50 rounded-full font-semibold text-sm h-9"
                              >
                                ADD
                              </Button>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="stepper"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center justify-center gap-2 bg-white border-2 border-primary-dark rounded-full px-2 py-1.5 w-full"
                            >
                              <motion.div whileTap={{ scale: 0.9 }}>
                                <Button
                                  variant="default"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(
                                      similarProduct.id,
                                      similarInCartQty - 1,
                                    );
                                  }}
                                  className="w-7 h-7 p-0"
                                  aria-label="Decrease quantity"
                                >
                                  −
                                </Button>
                              </motion.div>
                              <motion.span
                                key={similarInCartQty}
                                initial={{ scale: 1.2, y: -4 }}
                                animate={{ scale: 1, y: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 15,
                                }}
                                className="text-sm font-bold text-primary-dark min-w-[1.5rem] text-center"
                              >
                                {similarInCartQty}
                              </motion.span>
                              <motion.div whileTap={{ scale: 0.9 }}>
                                <Button
                                  variant="default"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(
                                      similarProduct.id,
                                      similarInCartQty + 1,
                                    );
                                  }}
                                  className="w-7 h-7 p-0"
                                  aria-label="Increase quantity"
                                >
                                  +
                                </Button>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {/* Sticky Footer - Flipkart Style */}
        <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-neutral-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="max-w-4xl mx-auto px-4 py-3 flex gap-4">
            {/* Add to Cart Button - Black / Stepper if in cart */}
            <div className="flex-1">
              {isRoomRent ? (
                <button
                  onClick={handleWhatsAppEnquiry}
                  className="w-full h-12 rounded-xl flex items-center justify-center font-bold text-sm bg-[#25D366] text-white hover:bg-[#128C7E] transition-all"
                >
                  <div className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    WhatsApp Enquiry
                  </div>
                </button>
              ) : inCartQty === 0 ? (
                <button
                  ref={addButtonRef}
                  onClick={handleAddToCart}
                  disabled={!isVariantAvailable}
                  className={`w-full h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all
                  ${!isVariantAvailable
                      ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                      : "bg-neutral-900 text-white hover:bg-neutral-800"
                    }
                `}
                >
                  {!isVariantAvailable ? "Out of Stock" : "Add to Cart"}
                </button>
              ) : (
                <div className="flex items-center justify-between gap-2 bg-white border-2 border-primary-dark rounded-xl px-3 h-12 w-full">
                  <button
                    onClick={() => {
                      const productId = product.id || product._id;
                      const variantId = selectedVariant?._id;
                      updateQuantity(productId, inCartQty - 1, variantId, variantTitle);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-primary-dark font-bold hover:bg-yellow-50 rounded-full transition-colors text-xl"
                  >
                    −
                  </button>
                  <span className="text-lg font-bold text-primary-dark">
                    {inCartQty}
                  </span>
                  <button
                    onClick={() => {
                      const productId = product.id || product._id;
                      const variantId = selectedVariant?._id;
                      updateQuantity(productId, inCartQty + 1, variantId, variantTitle);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-primary-dark font-bold hover:bg-yellow-50 rounded-full transition-colors text-xl"
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {/* Buy Now Button - Yellow */}
            {!isRoomRent && (
              <button
                onClick={handleBuyNow}
                disabled={!isVariantAvailable}
                className={`flex-1 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all
                ${!isVariantAvailable
                    ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                    : "bg-[#FFCC00] text-neutral-900 hover:bg-[#E6B800]"
                  }
              `}
              >
                Buy now at ₹{variantPrice.toLocaleString("en-IN")}
              </button>
            )}
          </div>
        </div>

      </div>
      {/* Bottom Share Sheet Fallback */}
      <ShareSheet
        isOpen={isShareSheetOpen}
        onClose={closeShareSheet}
        shareData={shareData}
        onCopyPath={copyToClipboard}
      />
    </div>
  );
}
