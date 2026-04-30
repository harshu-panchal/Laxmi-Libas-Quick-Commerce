import { useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api/config';
import { useJsApiLoader } from '@react-google-maps/api';
import { LocationContext, Location } from './locationContext.types';

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ['places'];

// Geocoding result interface
interface GeocodeResult {
  formatted_address: string;
  city?: string;
  state?: string;
  pincode?: string;
}

// Cache for geocoding results to avoid redundant API calls
const geocodeCache = new Map<string, { data: GeocodeResult; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour (reduced to avoid stale location)

// Generate cache key from coordinates
const getCacheKey = (lat: number, lng: number, precision: number = 4): string => {
  return `${lat.toFixed(precision)},${lng.toFixed(precision)}`;
};

// Calculate distance between two coordinates in km (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Clean address by removing Plus Codes and unwanted identifiers
const cleanAddress = (address: string): string => {
  if (!address) return address;

  // 1. Remove Plus Codes more comprehensively
  let cleaned = address
    // Remove Plus Code at start
    .replace(/^[A-Z0-9]{2,4}\+[A-Z0-9]{2,4}([,\s]+)?/i, '')
    // Remove Plus Code at end
    .replace(/([,\s]+)?[A-Z0-9]{2,4}\+[A-Z0-9]{2,4}$/i, '')
    // Remove Plus Code in middle
    .replace(/([,\s]+)[A-Z0-9]{2,4}\+[A-Z0-9]{2,4}([,\s]+)/gi, (_match, before, after) => {
      return before.includes(',') || after.includes(',') ? ', ' : ' ';
    })
    // Remove standalone Plus Code
    .replace(/\b[A-Z0-9]{2,4}\+[A-Z0-9]{2,4}\b/gi, '')
    // Clean up multiple commas/spaces
    .replace(/,\s*,+/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .trim();

  // 2. Deduplicate components (e.g., "Indore, Indore" or "Indore City, Indore")
  const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean);
  const uniqueParts: string[] = [];
  const seenLower = new Set<string>();

  for (const part of parts) {
    const lower = part.toLowerCase();
    
    // Skip if we've seen this exact part or a very similar one
    // We check if the new part is contained in any existing part or vice versa
    // e.g., if we have "Indore City", we skip "Indore"
    let isDuplicate = false;
    for (const existing of uniqueParts) {
      const existingLower = existing.toLowerCase();
      if (existingLower.includes(lower) || lower.includes(existingLower)) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      uniqueParts.push(part);
      seenLower.add(lower);
    }
  }

  return uniqueParts.join(', ');
};

// Fallback reverse geocoding using Nominatim (OpenStreetMap)
const reverseGeocodeNominatim = async (lat: number, lng: number, signal?: AbortSignal): Promise<GeocodeResult> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'LaxMart-Quick-Commerce-App' },
      signal
    });

    if (!response.ok) throw new Error('Nominatim request failed');
    
    const data = await response.json();
    const a = data.address || {};
    console.log('[LocationContext] Nominatim raw address details:', a);
    
    // Build address parts from most-specific to least-specific
    // Skip county/tahsil as they are bureaucratic and not user-friendly
    const building    = a.house_number ? `${a.house_number} ${a.road || ''}`.trim() : (a.building || a.amenity || a.shop || a.office || '');
    const road        = (!a.house_number && a.road) ? a.road : '';
    const suburb      = a.neighbourhood || a.suburb || a.residential || a.quarter || '';
    const district    = a.city_district || '';
    const city        = a.city || a.town || a.village || a.state_district || '';
    const state       = a.state || '';
    const pincode     = a.postcode || '';

    // Only include district if it's meaningfully different from city
    const showDistrict = district && city && !city.toLowerCase().includes(district.toLowerCase()) && !district.toLowerCase().includes(city.toLowerCase());

    const parts = [
      building,
      road,
      suburb,
      showDistrict ? district : '',
      city,
      state,
      pincode,
    ].filter(Boolean);

    // If we still have nothing specific, use display_name
    let formattedAddress = parts.length > 1 ? parts.join(', ') : (data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    
    // Clean and deduplicate
    formattedAddress = cleanAddress(formattedAddress);

    console.log('[LocationContext] Nominatim formatted address:', formattedAddress);

    return {
      formatted_address: formattedAddress,
      city: city || '', 
      state: state || '',
      pincode: pincode,
    };
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      console.error('❌ Nominatim fallback failed:', err);
    }
    return { formatted_address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
  }
};

export function LocationProvider({ children }: { children: ReactNode }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const { isAuthenticated, user } = useAuth();
  const [location, setLocation] = useState<Location | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'session_granted'>('prompt');
  const [showChangeModal, setShowChangeModal] = useState(false);

  // Constants for storage
  const SESSION_PERMISSION_KEY = 'location_permission_granted_session';
  const LOCATION_STORAGE_KEY = 'userLocation';

  // Refs for request cancellation and preventing race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const isRequestingRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdatePosRef = useRef<{lat: number, lng: number} | null>(null);

  // Initialize location state and check session permission
  useEffect(() => {
    const checkInitialPermission = async () => {
      console.log('[LocationContext] Checking initial permission status...');

      try {
        // 1. Check sessionStorage for session-level permission
        const sessionGranted = sessionStorage.getItem(SESSION_PERMISSION_KEY);

        if (sessionGranted === 'true') {
          console.log('[LocationContext] Permission already granted in this session.');

          // 2. Check for cached location in localStorage
          const cachedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
          if (cachedLocation) {
            try {
              const parsedLocation = JSON.parse(cachedLocation);
              console.log('[LocationContext] Using cached location, but triggering fresh update in background...');
              setLocation(parsedLocation);
              setIsLocationEnabled(true);
              setLocationPermissionStatus('session_granted');
              
              // Automatically trigger a fresh update in background
              setTimeout(() => {
                requestLocation().catch(() => {});
              }, 1000);
            } catch (e) {
              console.error('[LocationContext] Failed to parse cached location:', e);
            }
          } else {
            console.log('[LocationContext] Permission granted but no location. Triggering request...');
            setLocationPermissionStatus('session_granted');
            requestLocation().catch(() => {});
          }
        } else {
          console.log('[LocationContext] No session-level permission found. User will be prompted.');
          setLocation(null);
          setIsLocationEnabled(false);
          setLocationPermissionStatus('prompt');
        }
      } catch (error) {
        console.error('[LocationContext] Error checking session storage:', error);
        // Fallback to prompt if storage is unavailable
        setLocationPermissionStatus('prompt');
      } finally {
        setIsLocationLoading(false);
      }
    };

    checkInitialPermission();

    // Cleanup watch on unmount
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Watch location for real-time updates
  useEffect(() => {
    let watchId: number | null = null;

    const startWatch = (highAccuracy: boolean) => {
      if (!isLocationEnabled) return;
      
      console.log(`[LocationContext] Starting real-time watch (HighAccuracy: ${highAccuracy})...`);
      
      const watchOptions = {
        enableHighAccuracy: highAccuracy,
        timeout: 15000,
        maximumAge: 0,
      };

      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          if (!lastUpdatePosRef.current || 
              calculateDistance(lastUpdatePosRef.current.lat, lastUpdatePosRef.current.lng, latitude, longitude) > 0.01) {
            
            lastUpdatePosRef.current = { lat: latitude, lng: longitude };
            
            try {
              const geocodeResult = await reverseGeocode(latitude, longitude, undefined, false);
              
              const updatedLocation = {
                latitude,
                longitude,
                address: geocodeResult.formatted_address,
                city: geocodeResult.city,
                state: geocodeResult.state,
                pincode: geocodeResult.pincode,
              };

              setLocation(updatedLocation);
            } catch (e) {
              setLocation(prev => prev ? { ...prev, latitude, longitude } : null);
            }
          }
        },
        (error) => {
          console.warn('[LocationContext] Watch error:', error.message);
          if (highAccuracy && error.code === error.TIMEOUT) {
            console.log('[LocationContext] Watch high accuracy timeout, retrying with standard accuracy...');
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
            startWatch(false);
          }
        },
        watchOptions
      );
      watchIdRef.current = watchId;
    };

    if (isLocationEnabled) {
      startWatch(true);
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchIdRef.current = null;
      }
    };
  }, [isLocationEnabled]);

  // Request user's current location - OPTIMIZED for speed and accuracy
  const requestLocation = useCallback(async (): Promise<void> => {
    if (!navigator.geolocation) {
      console.error('[LocationContext] Geolocation is not supported');
      setLocationError('Geolocation is not supported by your browser');
      setIsLocationLoading(false);
      return;
    }

    // Prevent concurrent requests
    if (isRequestingRef.current) {
      return;
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear any cached geocode results to ensure fresh reverse geocoding
    geocodeCache.clear();

    isRequestingRef.current = true;
    setIsLocationLoading(true);
    setLocationError(null);
    abortControllerRef.current = new AbortController();

    console.log('[LocationContext] Requesting geolocation from browser...');

    return new Promise((resolve, reject) => {
      // Step 1: Attempt High Accuracy
      const attemptGeo = (highAccuracy: boolean) => {
        console.log(`[LocationContext] Geolocation attempt (HighAccuracy: ${highAccuracy})...`);
        
        const geoOptions = {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 15000 : 30000, // Even longer timeout for standard accuracy
          maximumAge: 0,
        };

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            console.log(`[LocationContext] Geolocation success. Accuracy: ${accuracy}m`);
            
            // IMMEDIATE UPDATE: Set coordinates first so the app becomes functional
            setIsLocationEnabled(true);
            const initialLocation: Location = { latitude, longitude, address: 'Resolving address...' };
            setLocation(initialLocation);
            
            try {
              sessionStorage.setItem(SESSION_PERMISSION_KEY, 'true');
              setLocationPermissionStatus('session_granted');
            } catch (e) {}

            try {
              // RICH UPDATE: Attempt to get the full address
              const geocodeResult = await reverseGeocode(latitude, longitude, abortControllerRef.current?.signal, true);

              const finalLocation: Location = {
                latitude,
                longitude,
                address: geocodeResult.formatted_address,
                city: geocodeResult.city,
                state: geocodeResult.state,
                pincode: geocodeResult.pincode,
              };

              setLocation(finalLocation);
              localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(finalLocation));
              
              // Save to backend if needed
              if (isAuthenticated && user && user.userType === 'Customer') {
                saveLocationToBackend(finalLocation).catch(() => {});
              }
            } catch (error) {
              console.warn('[LocationContext] Address resolution failed, using coordinates only:', error);
              // We already set the coordinates above, so the user can still proceed
            } finally {
              isRequestingRef.current = false;
              setIsLocationLoading(false);
              resolve();
            }
          },
          (error) => {
            if (highAccuracy && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
              console.warn('[LocationContext] High accuracy failed/timed out, trying standard accuracy...');
              attemptGeo(false); 
            } else {
              console.error('[LocationContext] Geolocation final failure:', error.message);
              setLocationError(error.code === error.TIMEOUT ? 'Location request timed out. Please check your signal.' : 'Location access denied.');
              setIsLocationLoading(false);
              isRequestingRef.current = false;
              resolve(); 
            }
          },
          geoOptions
        );
      };

      attemptGeo(true);
    });
  }, [isAuthenticated, user]);

  // Helper function to save location to backend (non-blocking)
  const saveLocationToBackend = async (locationData: Location): Promise<void> => {
    try {
      await api.post('/customer/location', {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address,
        city: locationData.city,
        state: locationData.state,
        pincode: locationData.pincode,
      });
    } catch (e) {
      console.error('Failed to save location to backend');
    }
  };

  // Reverse geocode coordinates to address - OPTIMIZED with JS SDK and retry logic
  const reverseGeocode = async (lat: number, lng: number, signal?: AbortSignal, skipCache: boolean = false): Promise<GeocodeResult> => {
    // Generate cache key
    const cacheKey = getCacheKey(lat, lng);

    if (!skipCache) {
      const cached = geocodeCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }

    // ── STEP 1: Google Maps REST API via direct HTTP fetch ──────────────────
    // This bypasses JS SDK and browser extension blocking entirely.
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      try {
        console.log('[LocationContext] Trying Google REST Geocoding API...');
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat.toFixed(6)},${lng.toFixed(6)}&key=${apiKey}&language=en`;
        const response = await fetch(geocodeUrl, { signal });
        const data = await response.json();

        console.log('[LocationContext] Google REST API status:', data.status);

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const result = data.results[0];
          const addressComponents = result.address_components || [];

          let city = '';
          let state = '';
          let pincode = '';

          addressComponents.forEach((component: any) => {
            const types = component.types || [];
            if (types.includes('locality')) city = component.long_name;
            else if (!city && types.includes('administrative_area_level_3')) city = component.long_name;
            else if (!city && types.includes('administrative_area_level_2')) city = component.long_name;
            if (types.includes('administrative_area_level_1')) state = component.long_name;
            if (types.includes('postal_code')) pincode = component.long_name;
          });

          const geocodeResult: GeocodeResult = {
            formatted_address: cleanAddress(result.formatted_address),
            city,
            state,
            pincode,
          };

          console.log('[LocationContext] ✅ Google REST geocode success:', geocodeResult.formatted_address);
          geocodeCache.set(cacheKey, { data: geocodeResult, timestamp: Date.now() });
          return geocodeResult;
        } else if (data.status === 'REQUEST_DENIED') {
          console.error('[LocationContext] ❌ Google API key is invalid or Geocoding API not enabled:', data.error_message);
        } else {
          console.warn('[LocationContext] Google REST API returned:', data.status);
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.warn('[LocationContext] Google REST geocode failed:', error.message);
        }
      }
    }

    // ── STEP 2: Google Maps JS SDK (if loaded and REST failed) ───────────────
    if (isLoaded && window.google?.maps?.Geocoder) {
      try {
        console.log('[LocationContext] Trying Google JS SDK Geocoder...');
        const geocoder = new window.google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });

        if (response.results && response.results[0]) {
          const result = response.results[0];
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

          const geocodeResult: GeocodeResult = {
            formatted_address: cleanAddress(result.formatted_address),
            city,
            state,
            pincode,
          };

          geocodeCache.set(cacheKey, { data: geocodeResult, timestamp: Date.now() });
          return geocodeResult;
        }
      } catch (error: any) {
        if (error.message?.includes('ApiNotActivatedMapError')) {
          console.error('❌ [LocationContext] Geocoding API not activated in Google Cloud Console.');
        } else {
          console.warn('⚠️ Google JS Geocoder failed:', error.message);
        }
      }
    }

    // ── STEP 3: Nominatim fallback (OpenStreetMap) ────────────────────────────
    console.log('[LocationContext] Falling back to Nominatim...');
    return await reverseGeocodeNominatim(lat, lng, signal);
  };

  // Update location manually - OPTIMIZED for instant UI update
  const updateLocation = useCallback(async (newLocation: Location): Promise<void> => {
    console.log('[LocationContext] Updating location manually:', newLocation.address);

    if (!newLocation.latitude || !newLocation.longitude ||
      isNaN(newLocation.latitude) || isNaN(newLocation.longitude)) {
      throw new Error('Invalid location coordinates');
    }

    try {
      sessionStorage.setItem(SESSION_PERMISSION_KEY, 'true');
      setLocationPermissionStatus('session_granted');
    } catch (e) {
      console.warn('[LocationContext] Failed to save to sessionStorage:', e);
    }

    setLocation(newLocation);
    setIsLocationEnabled(true);
    setLocationError(null);
    
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation));
    localStorage.setItem('coords', JSON.stringify({ 
      lat: newLocation.latitude, 
      lng: newLocation.longitude 
    }));

    if (isAuthenticated && user && user.userType === 'Customer') {
      saveLocationToBackend(newLocation).catch(() => {});
    }
  }, [isAuthenticated, user, SESSION_PERMISSION_KEY, LOCATION_STORAGE_KEY]);

  const refreshLocation = useCallback(async (): Promise<void> => {
    console.log('[LocationContext] Refreshing location...');
    return requestLocation();
  }, [requestLocation]);

  const clearLocation = useCallback(() => {
    sessionStorage.removeItem(SESSION_PERMISSION_KEY);
    localStorage.removeItem(LOCATION_STORAGE_KEY);
    localStorage.removeItem('coords');
    setLocation(null);
    setIsLocationEnabled(false);
    setLocationPermissionStatus('prompt');
    lastUpdatePosRef.current = null;
  }, [SESSION_PERMISSION_KEY, LOCATION_STORAGE_KEY]);

  const value = {
    location,
    isLocationEnabled,
    isLocationLoading,
    locationError,
    locationPermissionStatus,
    requestLocation,
    updateLocation,
    refreshLocation,
    showChangeModal,
    setShowChangeModal,
    clearLocation,
    reverseGeocode: (lat: number, lng: number) => reverseGeocode(lat, lng),
    calculateDistance: (lat: number, lng: number) => {
      if (!location) return 0;
      return calculateDistance(location.latitude, location.longitude, lat, lng);
    },
  };


  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}
