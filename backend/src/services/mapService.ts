import axios from 'axios';
import { calculateDistance as haversineDistance } from '../utils/locationHelper';

interface LatLng {
    lat: number;
    lng: number;
}

/**
 * Get road distance between two points using Google Maps Distance Matrix API
 * Fallbacks to Haversine straight-line distance if API key is missing or API fails
 */
export const getRoadDistance = async (
    origin: LatLng,
    destination: LatLng,
    apiKey?: string
): Promise<number> => {
    // If no API key or invalid coordinates, fallback to Haversine
    if (!apiKey || !origin.lat || !origin.lng || !destination.lat || !destination.lng) {
        return haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${apiKey}`;

        const response = await axios.get(url);

        if (response.data.status === 'OK') {
            const element = response.data.rows[0].elements[0];
            if (element.status === 'OK') {
                // Distance in meters, convert to km
                const distanceInKm = element.distance.value / 1000;
                return distanceInKm;
            }
        }

        console.warn('Google Maps API Error or No Route Found:', response.data);
        // Fallback to Haversine on API specific error (e.g. ZERO_RESULTS)
        return haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);

    } catch (error: any) {
        console.error('Google Maps API Request Failed:', error.message);
        return haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    }
};

/**
 * Get matrix of road distances from multiple origins to one destination
 * Returns array of distances in km
 */
export const getRoadDistances = async (
    origins: LatLng[],
    destination: LatLng,
    apiKey?: string
): Promise<number[]> => {
    if (!origins.length) return [];

    if (!apiKey) {
        return origins.map(org => haversineDistance(org.lat, org.lng, destination.lat, destination.lng));
    }

    try {
        const originsStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
        const destinationsStr = `${destination.lat},${destination.lng}`;
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destinationsStr}&key=${apiKey}`;

        const response = await axios.get(url);

        if (response.data.status === 'OK') {
            return response.data.rows.map((row: any, index: number) => {
                const element = row.elements[0];
                if (element.status === 'OK') {
                    return element.distance.value / 1000;
                } else {
                    // Fallback individual element failure
                    const org = origins[index];
                    return haversineDistance(org.lat, org.lng, destination.lat, destination.lng);
                }
            });
        }

        console.warn('Google Maps API Global Error:', response.data);
        return origins.map(org => haversineDistance(org.lat, org.lng, destination.lat, destination.lng));

    } catch (error: any) {
        console.error('Google Maps Matrix API Request Failed:', error.message);
        return origins.map(org => haversineDistance(org.lat, org.lng, destination.lat, destination.lng));
    }
};

/**
 * Reverse geocode coordinates to address using Google Maps Geocoding API
 */
export const reverseGeocode = async (
    lat: number,
    lng: number,
    apiKey?: string
): Promise<any> => {
    if (!apiKey) {
        throw new Error('Google Maps API key is required for geocoding');
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=en`;
        const response = await axios.get(url);

        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const result = response.data.results[0];
            const addressComponents = result.address_components || [];
            
            let city = '';
            let state = '';
            let pincode = '';

            addressComponents.forEach((component: any) => {
                const types = component.types || [];
                if (types.includes('locality')) city = component.long_name;
                else if (!city && types.includes('administrative_area_level_2')) city = component.long_name;
                
                if (types.includes('administrative_area_level_1')) state = component.long_name;
                if (types.includes('postal_code')) pincode = component.long_name;
            });

            return {
                formatted_address: result.formatted_address,
                city,
                state,
                pincode,
                results: response.data.results
            };
        }

        throw new Error(response.data.error_message || response.data.status || 'Failed to geocode');

    } catch (error: any) {
        console.error('Google Reverse Geocode Failed:', error.message);
        throw error;
    }
};
