import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getAddresses, Address } from '../../services/api/customerAddressService';
import Button from '../../components/ui/button';
import { appConfig } from '../../services/configService';
import { calculateProductPrice } from '../../utils/priceUtils';
import StarRating from '../../components/ui/StarRating';
import { ChevronDown, Trash2, Bookmark, Zap, Info, ChevronRight } from 'lucide-react';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('laxmart');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLoadingAddresses(true);
      getAddresses().then(res => {
        if (res.success && Array.isArray(res.data)) {
          setAddresses(res.data);
        }
      }).finally(() => setLoadingAddresses(false));
    }
  }, [isAuthenticated]);

  const deliveryFee = (cart.finalTotal || cart.total) >= appConfig.freeDeliveryThreshold ? 0 : appConfig.deliveryFee;
  const platformFee = appConfig.platformFee;
  const totalAmount = (cart.finalTotal || cart.total) + deliveryFee + platformFee;

  const buttonConfig = useMemo(() => {
    if (!isAuthenticated) {
      return { text: 'LOGIN TO PROCEED', action: () => navigate(`/login?redirect=/cart`) };
    }
    if (!loadingAddresses && addresses.length === 0) {
      return { text: 'ADD ADDRESS', action: () => navigate('/checkout/address') };
    }
    const flowType = activeTab === 'minutes' ? 'quick' : 'ecommerce';
    return { text: 'PROCEED TO CHECKOUT', action: () => navigate(`/checkout?flow=${flowType}`) };
  }, [isAuthenticated, loadingAddresses, addresses, activeTab]);

  // Mock address data for display if logged in and has address
  const activeAddress = addresses.length > 0 ? addresses[0] : null;

  const quickItems = cart.items.filter(item => item.product.type === 'quick' || !item.product.type || item.product.type === 'both');
  const ecommerceItems = cart.items.filter(item => item.product.type === 'ecommerce' || item.product.type === 'both');

  const visibleItems = activeTab === 'minutes' ? quickItems : ecommerceItems;
  const laxmartItemsCount = ecommerceItems.length;
  const minutesItemsCount = quickItems.length;

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center bg-white">
        <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
          <Trash2 size={48} className="text-neutral-300" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Your cart is empty</h2>
        <p className="text-neutral-500 mb-8 max-w-[250px]">Add items to your cart to see them here and proceed to checkout.</p>
        <Link to="/">
          <Button variant="default" size="lg" className="rounded-full px-10 bg-primary-dark hover:bg-yellow-700">
            Shop Now
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-100 pb-36">
      {/* 1. Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-50">
          <h1 className="text-lg font-semibold text-neutral-800">My Cart</h1>
        </div>
        
        <div className="flex border-b border-neutral-100">
          <button 
            onClick={() => setActiveTab('laxmart')}
            className={`flex-1 py-3 text-sm font-bold tracking-tight transition-all relative ${
              activeTab === 'laxmart' ? 'text-blue-600' : 'text-neutral-500'
            }`}
          >
            Laxmart ({laxmartItemsCount})
            {activeTab === 'laxmart' && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-full mx-4" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('minutes')}
            className={`flex-1 py-3 text-sm font-bold tracking-tight transition-all relative ${
              activeTab === 'minutes' ? 'text-blue-600' : 'text-neutral-500'
            }`}
          >
            Minutes ({minutesItemsCount})
            {activeTab === 'minutes' && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-full mx-4" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Delivery Address */}
      {isAuthenticated && (
        <div className="bg-white px-4 py-3 mb-2 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-700 font-medium">Deliver to: <span className="font-bold">{activeAddress ? `${activeAddress.fullName.split(' ')[0]}... , ${activeAddress.pincode}` : 'Select Address'}</span></span>
              {activeAddress && (
                <span className="bg-neutral-100 text-[10px] text-neutral-500 font-bold px-1.5 py-0.5 rounded border border-neutral-200">
                  {activeAddress.type.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 truncate max-w-[280px]">
              {activeAddress ? activeAddress.address : 'Please add a delivery address to proceed'}
            </p>
          </div>
          <Button 
            onClick={() => navigate('/address-book')}
            variant="outline" 
            size="sm" 
            className="bg-white text-blue-600 border-neutral-200 rounded px-4 py-1.5 h-auto text-xs font-bold hover:bg-neutral-50"
          >
            {activeAddress ? 'Change' : 'Add'}
          </Button>
        </div>
      )}

      {/* 3. Cart Items */}
      <div className="space-y-2">
        {visibleItems.length === 0 ? (
          <div className="bg-white py-20 flex flex-col items-center justify-center text-center">
            <Trash2 size={40} className="text-neutral-200 mb-4" />
            <p className="text-neutral-400 text-sm">No items in this section</p>
          </div>
        ) : (
          visibleItems.map((item) => {
          const { displayPrice, mrp, discount } = calculateProductPrice(item.product, item.variant);
          const rating = (item.product.rating || 3.4);
          const reviews = (item.product.reviews || 150);

          return (
            <div key={item.product.id} className="bg-white">
              <div className="p-4 flex gap-4">
                {/* Image & Qty */}
                <div className="flex flex-col gap-3">
                  <Link to={`/product/${item.product.id}`} className="w-20 h-20 bg-neutral-50 rounded border border-neutral-100 overflow-hidden flex items-center justify-center p-1 flex-shrink-0">
                    <img 
                      src={item.product.imageUrl || item.product.mainImage} 
                      alt={item.product.name}
                      className="w-full h-full object-contain"
                    />
                  </Link>
                  <div className="relative">
                    <select 
                      className="w-full bg-white border border-neutral-200 rounded px-2 py-1 text-xs font-bold appearance-none pr-8 cursor-pointer text-neutral-800"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value), item.variant)}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <option key={n} value={n}>Qty: {n}</option>
                      ) )}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col pt-0.5 relative">
                  <button 
                    onClick={() => removeFromCart(item.product.id, item.variant)}
                    className="absolute top-0 right-0 p-1 text-neutral-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                  <Link to={`/product/${item.product.id}`} className="flex flex-col mb-1 group">
                    <h3 className="text-sm font-medium text-neutral-900 pr-8 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {((item.product as any).brand && !/^[0-9a-fA-F]{24}$/.test((item.product as any).brand)) && (
                        <span className="font-bold mr-1 uppercase text-neutral-500 text-[10px] tracking-wide">
                          {(item.product as any).brand}
                        </span>
                      )}
                      {item.product.name}
                    </h3>
                  </Link>
                  {(() => {
                    // Find the actual variation object to get the human-readable title
                    const selectedVar = item.product.variations?.find((v: any) => 
                      (v._id === item.variant || v.id === item.variant || v.title === item.variant || v.value === item.variant)
                    );
                    
                    // Get the label (Title like 'M' or 'XL', otherwise fallback to the raw variant string)
                    const rawLabel = selectedVar?.title || selectedVar?.name || selectedVar?.value || item.variant;
                    
                    // VALIDATION: If the label looks like a Mongo ID (24 hex characters), don't show it 
                    // unless we have nothing else. This prevents "69de1be7..." from showing in UI.
                    const isMongoId = typeof rawLabel === 'string' && /^[0-9a-fA-F]{24}$/.test(rawLabel);
                    const variantLabel = isMongoId ? (selectedVar?.title || '') : rawLabel;

                    if (!variantLabel || variantLabel === '') return null;

                    return (
                      <p className="text-[12px] font-bold text-neutral-600 bg-neutral-100 w-fit px-2 py-0.5 rounded border border-neutral-200 mb-2">
                        {['S', 'M', 'L', 'XL', 'XXL', 'XS', 'XXXL'].includes(String(variantLabel).toUpperCase()) 
                          ? `Size: ${variantLabel}` 
                          : variantLabel}
                      </p>
                    );
                  })()}
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <StarRating rating={rating} reviewCount={reviews} size="sm" showCount={true} />
                  </div>

                  {/* Price */}
                  <div className="flex items-center flex-wrap gap-2 mb-1.5">
                    {discount > 0 && (
                      <span className="text-green-600 text-sm font-bold flex items-center gap-0.5">
                        <span className="text-[12px]">↓</span>{discount}%
                      </span>
                    )}
                    <span className="text-sm text-neutral-400 line-through">₹{mrp.toLocaleString('en-IN')}</span>
                    <span className="text-base font-black text-neutral-900">₹{displayPrice.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Wow Offer */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-blue-600 text-white text-[8px] font-black px-1 py-0.5 rounded italic">WOW!</span>
                      <span className="text-[11px] font-bold text-blue-600">Buy at ₹{(displayPrice * 0.75).toFixed(0)}</span>
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      Or Pay ₹{(displayPrice * 0.9).toFixed(0)} + <span className="text-yellow-500 font-bold">12 🪙</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="px-4 pb-4 border-b border-neutral-100">
                <p className="text-xs text-neutral-800">
                  Delivery by <span className="font-bold">Apr 11, Sat</span>
                </p>
              </div>
            </div>
          );
        }))}
      </div>

      {/* 4. Bottom Sticky Section */}
      <div className="fixed bottom-[calc(72px+env(safe-area-inset-bottom,20px))] md:bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {/* Savings Ribbon */}
        <div className="bg-emerald-50 px-4 py-2 flex items-center gap-2 border-b border-emerald-100">
          <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">%</span>
          </div>
          <span className="text-xs font-bold text-emerald-700">
            You'll save ₹{cart.totalDiscount?.toLocaleString('en-IN') || '27,220'} on this order!
          </span>
        </div>

        {/* Pricing Actions */}
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-neutral-400 line-through">₹{(totalAmount * 1.4).toLocaleString('en-IN')}</span>
              <span className="text-lg font-black text-neutral-900">₹{totalAmount.toLocaleString('en-IN')}</span>
              <Info size={14} className="text-neutral-300" />
            </div>
            <button className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
              View price details <ChevronRight size={10} />
            </button>
          </div>
          <Button 
            onClick={buttonConfig.action}
            size="lg" 
            className="flex-1 max-w-[200px] h-12 bg-[#fbbf24] hover:bg-[#d97706] text-neutral-900 text-[13px] font-black tracking-tight rounded uppercase shadow-md transition-all active:scale-95"
          >
            {buttonConfig.text}
          </Button>
        </div>
      </div>
    </div>
  );
}

