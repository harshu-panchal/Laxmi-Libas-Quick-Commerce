import { useCallback, useEffect, useRef, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

export interface AutocompleteResult {
  address: string;
  lat: number;
  lng: number;
  placeName: string;
  city: string;
  state: string;
  pincode: string;
  structuredLocation: {
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
}

interface GoogleMapsAutocompleteProps {
  value: string;
  onChange: (result: AutocompleteResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

type Libraries = ("places" | "drawing" | "geometry" | "visualization")[];
const libraries: Libraries = ['places'];

// Clean address by removing Plus Codes and unwanted identifiers
const cleanAddress = (address: string): string => {
  if (!address) return address;

  const cleaned = address
    .replace(/^[A-Z0-9]{2,4}\+[A-Z0-9]{2,4}([,\s]+)?/i, '')
    .replace(/([,\s]+)?[A-Z0-9]{2,4}\+[A-Z0-9]{2,4}$/i, '')
    .replace(/([,\s]+)[A-Z0-9]{2,4}\+[A-Z0-9]{2,4}([,\s]+)/gi, (_match, before, after) => {
      return before.includes(',') || after.includes(',') ? ', ' : ' ';
    })
    .replace(/\s+[A-Z0-9]{2,4}\+[A-Z0-9]{2,4}\s+/gi, ' ')
    .replace(/\b[A-Z0-9]{2,4}\+[A-Z0-9]{2,4}\b/gi, '')
    .replace(/,\s*,+/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .trim();

  return cleaned;
};

export default function GoogleMapsAutocomplete({
  value,
  onChange,
  placeholder = 'Search location...',
  className = '',
  disabled = false,
  required = false,
}: GoogleMapsAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const autocompleteRef = useRef<any>(null);
  const [error, setError] = useState<string>('');
  const [inputValue, setInputValue] = useState(value);
  const [lastSelectedValue, setLastSelectedValue] = useState(value);

  // Use the same loader configuration as LocationPickerMap
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
  });

  // Update local input value when prop changes
  useEffect(() => {
    setInputValue(value);
    setLastSelectedValue(value);
  }, [value]);

  useEffect(() => {
    if (loadError) {
      setError(`Failed to load Google Maps API: ${loadError.message}`);
    }
  }, [loadError]);

  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places || autocompleteRef.current) return;

    try {
      const places = window.google.maps.places as any;

      if (!places.Autocomplete) {
        setError('Google Maps Places Autocomplete not available');
        return;
      }

      const autocomplete = new places.Autocomplete(inputRef.current, {
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: 'in' },
        fields: ['address_components', 'formatted_address', 'geometry', 'name'],
      });

      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', async () => {
        const place = autocomplete.getPlace();

        if (!place.geometry || !place.geometry.location) {
          setError('Please select a location from the list');
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const rawAddress = place.formatted_address || place.name || '';
        const address = cleanAddress(rawAddress);
        
        let city = '';
        let state = '';
        let pincode = '';
        let country = 'India';

        const extractFromComponents = (components: any[]) => {
          for (const component of components) {
            const types = component.types;
            if (types.includes('locality')) city = component.long_name;
            else if (types.includes('administrative_area_level_3') && !city) city = component.long_name;
            else if (types.includes('administrative_area_level_2') && !city) city = component.long_name;
            
            if (types.includes('administrative_area_level_1')) state = component.long_name;
            if (types.includes('postal_code')) pincode = component.long_name;
            if (types.includes('country')) country = component.long_name;
          }
        };

        if (place.address_components) {
          extractFromComponents(place.address_components);
        }

        // If pincode is still missing, attempt reverse geocoding for more precision
        if (!pincode && window.google?.maps?.Geocoder) {
          try {
            const geocoder = new window.google.maps.Geocoder();
            const results = await new Promise<any[]>((resolve, reject) => {
              geocoder.geocode({ location: { lat, lng } }, (res: any, status: any) => {
                if (status === 'OK') resolve(res);
                else reject(status);
              });
            });

            // Search results for a postal code
            for (const res of results) {
              const pc = res.address_components.find((c: any) => c.types.includes('postal_code'));
              if (pc) {
                pincode = pc.long_name;
                break;
              }
            }
          } catch (geocodingError) {
            console.warn('Geocoding fallback failed:', geocodingError);
          }
        }

        const result: AutocompleteResult = {
          address,
          lat,
          lng,
          placeName: place.name || address,
          city,
          state,
          pincode,
          structuredLocation: {
            address,
            city,
            state,
            country,
            pincode,
            coordinates: { lat, lng }
          }
        };

        setInputValue(address);
        setLastSelectedValue(address);
        onChange(result);
        setError('');
      });
    } catch (err: unknown) {
      console.error('Autocomplete initialization error:', err);
    }
  }, [onChange]);

  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      initializeAutocomplete();
    }

    const handlePacClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.pac-item')) {
        e.stopPropagation();
      }
    };

    document.addEventListener('click', handlePacClick, true);

    return () => {
      document.removeEventListener('click', handlePacClick, true);
    }
  }, [isLoaded, initializeAutocomplete]);

  const handleBlur = () => {
    // Revert to last valid selected value if user typed manually without selecting
    if (inputValue !== lastSelectedValue) {
      setInputValue(lastSelectedValue);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 bg-white ${className}`}
        disabled={disabled || !isLoaded}
        required={required}
        autoComplete="off"
      />
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      {!isLoaded && !error && (
        <p className="mt-1 text-xs text-neutral-500">Loading location services...</p>
      )}
    </div>
  );
}
