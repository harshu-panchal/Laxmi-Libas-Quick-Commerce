/**
 * Normalizes city names to a consistent format (Pascal Case)
 * Example: "indore" -> "Indore", "NEW DELHI" -> "New Delhi"
 */
export const normalizeCity = (city: string): string => {
  if (!city) return '';
  return city
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Validates if two cities are the same after normalization
 */
export const isSameCity = (city1: string, city2: string): boolean => {
  return normalizeCity(city1) === normalizeCity(city2);
};

/**
 * Calculates the distance between two coordinates in kilometers using Haversine formula
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Determines delivery type based on distance
 */
export const getDeliveryTypeByDistance = (distanceKm: number): {
  type: 'quick' | 'same-day' | 'standard';
  label: string;
  time: string;
} => {
  if (distanceKm <= 5) {
    return { type: 'quick', label: 'Quick Delivery', time: '30-45 min' };
  } else if (distanceKm <= 15) {
    return { type: 'same-day', label: 'Same Day Delivery', time: '4-6 hours' };
  } else {
    return { type: 'standard', label: 'Standard Delivery', time: '3-5 days' };
  }
};
