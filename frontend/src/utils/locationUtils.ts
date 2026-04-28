
/**
 * Normalizes city names for consistent comparison
 * e.g., "Indore", "Indore City", "indore" -> "indore"
 */
export const normalizeCity = (city: string): string => {
    if (!city) return '';
    return city
        .toLowerCase()
        .replace(/\s+city$/i, '') // Remove " City" suffix
        .replace(/\s+tahsil$/i, '') // Remove " Tahsil" suffix
        .trim();
};

/**
 * Calculates distance between two points in km
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}
