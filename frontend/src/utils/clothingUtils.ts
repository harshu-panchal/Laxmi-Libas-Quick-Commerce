/**
 * Utility to filter products to only show clothing-related items.
 * This is used to temporarily hide certain categories like footwear, groceries, electronics, etc.
 * based on user request.
 */

export const isClothingRelated = (item: any): boolean => {
  if (!item) return false;
  
  let name = "";
  if (typeof item === 'string') {
    name = item.toLowerCase();
  } else {
    name = (item.name || item.productName || item.title || item.slug || "").toLowerCase();
  }
  
  // Keywords that identify clothing
  const isClothing = 
    name.includes('clothing') || name.includes('fashion') || name.includes('wear') || 
    name.includes('shirt') || name.includes('pant') || name.includes('jeans') || 
    name.includes('top') || name.includes('dress') || name.includes('kurta') || 
    name.includes('saree') || name.includes('suit') || name.includes('jacket') ||
    name.includes('vest') || name.includes('bra') || name.includes('undie') || 
    name.includes('lower') || name.includes('inner') || name.includes('ethnic') ||
    name.includes('western') || name.includes('men') || name.includes('women') ||
    name.includes('boy') || name.includes('girl') || name.includes('kid') ||
    name.includes('panties') || name.includes('socks') || name.includes('hose') || 
    name.includes('uniform') || name.includes('scrubs') || name.includes('school') || 
    name.includes('gown') || name.includes('tee') || name.includes('hoodie') || 
    name.includes('denim') || name.includes('leggings') || name.includes('pajama') ||
    name.includes('clothing') || name.includes('fabric') || name.includes('kurti') ||
    name.includes('lehenga') || name.includes('dupatta') || name.includes('sherwani') ||
    name.includes('boxer') || name.includes('trunk') || name.includes('brief') ||
    name.includes('towel') || name.includes('scarf') || name.includes('belt');

  // Keywords that identify footwear (which should be HIDDEN)
  const isFootwear = 
    name.includes('footwear') || name.includes('shoes') || name.includes('shoe') || name.includes('sandal') || 
    name.includes('slipper') || name.includes('boot') || name.includes('heels') ||
    name.includes('flipflop') || name.includes('sneaker') || name.includes('loafer') ||
    name.includes('crocs') || name.includes('foot');

  if (isFootwear) return false;
  
  return isClothing;
};
