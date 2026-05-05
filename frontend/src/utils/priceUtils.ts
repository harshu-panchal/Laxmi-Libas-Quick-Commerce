import { Product } from '../types/domain';

export interface CalculatedPrice {
  displayPrice: number;
  mrp: number;
  discount: number;
  hasDiscount: boolean;
}

export const calculateProductPrice = (product: any, variationSelector?: number | string): CalculatedPrice => {
  if (!product) {
    return {
      displayPrice: 0,
      mrp: 0,
      discount: 0,
      hasDiscount: false
    };
  }

  let variation;
  if (typeof variationSelector === 'number') {
    variation = product.variations?.[variationSelector];
  } else if (typeof variationSelector === 'string' && variationSelector) {
    variation = product.variations?.find((v: any) => 
      v._id === variationSelector || 
      v.id === variationSelector ||
      v.title === variationSelector ||
      v.value === variationSelector ||
      v.name === variationSelector
    );
  }

  // Fallback to first variation if no specific one selected/found but variations exist
  if (!variation && product.variations?.length > 0 && (variationSelector === undefined || variationSelector === null || variationSelector === '')) {
    variation = product.variations[0];
  }

  let displayPrice: number;
  let mrp: number;

  if (variation) {
    // If we have a variation, it takes full precedence for pricing
    displayPrice = (variation.discPrice && variation.discPrice > 0)
      ? variation.discPrice
      : (variation.price || 0);
    
    mrp = variation.price || 0;
  } else {
    // Product-level pricing
    displayPrice = (product.discPrice && product.discPrice > 0)
      ? product.discPrice
      : (product.price || 0);
      
    mrp = product.mrp || product.compareAtPrice || product.price || 0;
  }

  // Final safety checks
  if (displayPrice === 0 && mrp > 0) displayPrice = mrp;
  if (mrp === 0 && displayPrice > 0) mrp = displayPrice;

  const hasDiscount = mrp > displayPrice;
  const discount = hasDiscount ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;

  return {
    displayPrice,
    mrp,
    discount,
    hasDiscount
  };
};
