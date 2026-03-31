/**
 * Utility to filter products to only show clothing-related items.
 * This is used to temporarily hide certain categories like footwear, groceries, electronics, etc.
 * based on user request.
 */

export const isClothingRelated = (item: any): boolean => {
  if (!item) return false;
  
  const name = (item.name || item.productName || item.title || item.slug || "").toLowerCase();
  
  // Keywords that identify clothing
  const isClothing = 
    name.includes('clothing') || name.includes('fashion') || name.includes('wear') || 
    name.includes('shirt') || name.includes('pant') || name.includes('jeans') || 
    name.includes('top') || name.includes('dress') || name.includes('kurta') || 
    name.includes('saree') || name.includes('suit') || name.includes('jacket') ||
    name.includes('vest') || name.includes('bra') || name.includes('undie') || 
    name.includes('panties') || name.includes('socks') || name.includes('hose') || 
    name.includes('uniform') || name.includes('scrubs') || name.includes('school') || 
    name.includes('gown') || name.includes('tee') || name.includes('hoodie') || 
    name.includes('denim') || name.includes('leggings') || name.includes('pajama') ||
    name.includes('clothing') || name.includes('fabric') || name.includes('kurti') ||
    name.includes('lehenga') || name.includes('dupatta') || name.includes('sherwani') ||
    name.includes('boxer') || name.includes('trunk') || name.includes('brief') ||
    name.includes('towel') || name.includes('scarf') || name.includes('belt'); // Belts/Scarves are accessories but usually grouped with clothing

  // Keywords that identify footwear (which should be HIDDEN even if they have "wear" or "school")
  const isFootwear = 
    name.includes('footwear') || name.includes('shoes') || name.includes('shoe') || name.includes('sandal') || 
    name.includes('slipper') || name.includes('boot') || name.includes('heels') ||
    name.includes('flipflop') || name.includes('sneaker') || name.includes('loafer') ||
    name.includes('crocs') || name.includes('foot');

  // Strict rule: MUST be clothing and NOT footwear
  // If it's footwear, it's NOT clothing related for this purpose
  if (isFootwear) return false;
  
  return isClothing;
};
