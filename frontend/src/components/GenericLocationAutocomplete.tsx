import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';

interface LocationData {
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
    placeName?: string;
}

interface GenericLocationAutocompleteProps {
    value: string;
    onSelect: (data: LocationData) => void;
    placeholder?: string;
    className?: string;
    hideFindButton?: boolean;
    suggestions?: string[]; // New prop for registered cities
}

const GenericLocationAutocomplete: React.FC<GenericLocationAutocompleteProps> = ({
    value,
    onSelect,
    placeholder = "Search city or location...",
    className = "",
    hideFindButton = false,
    suggestions = []
}) => {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const lastSearchedQuery = useRef('');

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync with value prop if it changes externally
    useEffect(() => {
        // Only sync if the external value actually changed to something new 
        // and we are not currently in the middle of a search/selection
        if (value !== undefined && value !== query && !isOpen && value !== lastSearchedQuery.current) {
            setQuery(value);
        }
    }, [value, isOpen]);

    const commonCities = [
        { id: 'fc-1', display_name: 'Indore, Madhya Pradesh', lat: 22.7196, lon: 75.8577, city: 'Indore', state: 'Madhya Pradesh' },
        { id: 'fc-2', display_name: 'Bhopal, Madhya Pradesh', lat: 23.2599, lon: 77.4126, city: 'Bhopal', state: 'Madhya Pradesh' },
        { id: 'fc-3', display_name: 'Ujjain, Madhya Pradesh', lat: 23.1765, lon: 75.7885, city: 'Ujjain', state: 'Madhya Pradesh' },
        { id: 'fc-4', display_name: 'Mumbai, Maharashtra', lat: 19.0760, lon: 72.8777, city: 'Mumbai', state: 'Maharashtra' },
        { id: 'fc-5', display_name: 'Delhi, NCR', lat: 28.6139, lon: 77.2090, city: 'Delhi', state: 'Delhi' },
        { id: 'fc-6', display_name: 'Ahmedabad, Gujarat', lat: 23.0225, lon: 72.5714, city: 'Ahmedabad', state: 'Gujarat' },
        { id: 'fc-7', display_name: 'Pune, Maharashtra', lat: 18.5204, lon: 73.8567, city: 'Pune', state: 'Maharashtra' },
        { id: 'fc-8', display_name: 'Bangalore, Karnataka', lat: 12.9716, lon: 77.5946, city: 'Bangalore', state: 'Karnataka' },
        { id: 'fc-9', display_name: 'Hyderabad, Telangana', lat: 17.3850, lon: 78.4867, city: 'Hyderabad', state: 'Telangana' },
        { id: 'fc-10', display_name: 'Chennai, Tamil Nadu', lat: 13.0827, lon: 80.2707, city: 'Chennai', state: 'Tamil Nadu' },
        { id: 'fc-11', display_name: 'Kolkata, West Bengal', lat: 22.5726, lon: 88.3639, city: 'Kolkata', state: 'West Bengal' },
        { id: 'fc-12', display_name: 'Jabalpur, Madhya Pradesh', lat: 23.1815, lon: 79.9864, city: 'Jabalpur', state: 'Madhya Pradesh' },
        { id: 'fc-13', display_name: 'Gwalior, Madhya Pradesh', lat: 26.2183, lon: 78.1828, city: 'Gwalior', state: 'Madhya Pradesh' },
        { id: 'fc-14', display_name: 'Sagar, Madhya Pradesh', lat: 23.8388, lon: 78.7378, city: 'Sagar', state: 'Madhya Pradesh' },
        { id: 'fc-15', display_name: 'Satna, Madhya Pradesh', lat: 24.6005, lon: 80.8322, city: 'Satna', state: 'Madhya Pradesh' },
        { id: 'fc-16', display_name: 'Ratlam, Madhya Pradesh', lat: 23.3315, lon: 75.0367, city: 'Ratlam', state: 'Madhya Pradesh' },
        { id: 'fc-17', display_name: 'Dewas, Madhya Pradesh', lat: 22.9676, lon: 76.0534, city: 'Dewas', state: 'Madhya Pradesh' },
        { id: 'fc-18', display_name: 'Rewa, Madhya Pradesh', lat: 24.5362, lon: 81.3037, city: 'Rewa', state: 'Madhya Pradesh' },
        { id: 'fc-19', display_name: 'Nagpur, Maharashtra', lat: 21.1458, lon: 79.0882, city: 'Nagpur', state: 'Maharashtra' },
    ];

    const performSearch = async (searchText: string) => {
        if (!searchText || searchText.length < 2) return; // Allow 2 characters for registered cities
        
        console.log('[LocationSearch] Searching for:', searchText);
        setLoading(true);
        setError(null);
        setResults([]);
        setIsOpen(true);

        try {
            // 0. Priority: Suggestions (Registered Cities)
            if (suggestions && suggestions.length > 0) {
                const filtered = suggestions
                    .filter(s => s.toLowerCase().includes(searchText.toLowerCase()))
                    .map(s => ({
                        id: `suggestion-${s}`,
                        display_name: s,
                        source: 'suggestion'
                    }));
                
                if (filtered.length > 0) {
                    setResults(filtered);
                    setLoading(false);
                    return;
                }
                
                // If suggestions are provided but NO match found, we should probably stop here
                // to enforce "registered-only" cities if that's the intent.
                // However, to be safe, I'll allow fallback IF suggestions were NOT provided.
                // But the user objective says "registered-only city search lists".
                // So if suggestions are provided, I'll RESTRICT to them.
                setResults([]);
                setError(`No registered cities found for "${searchText}"`);
                setLoading(false);
                return;
            }

            // 1. Try Google with a 2-second timeout
            if (window.google?.maps?.places) {
                console.log('[LocationSearch] Trying Google Places...');
                const googleResults = await Promise.race([
                    new Promise<any[]>((resolve) => {
                        const service = new window.google.maps.places.AutocompleteService();
                        service.getPlacePredictions(
                            { input: searchText, componentRestrictions: { country: 'in' } },
                            (predictions, status) => {
                                if (status === 'OK' && predictions) {
                                    resolve(predictions.map(p => ({
                                        id: `google-${p.place_id}`,
                                        display_name: p.description,
                                        source: 'google',
                                        place_id: p.place_id
                                    })));
                                } else {
                                    resolve([]);
                                }
                            }
                        );
                    }),
                    new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 2000))
                ]);

                if (googleResults.length > 0) {
                    setResults(googleResults);
                    setLoading(false);
                    return;
                }
            }

            // 2. Try Nominatim with a 3-second timeout
            console.log('[LocationSearch] Falling back to Nominatim...');
            const nominatimResults = await Promise.race([
                (async () => {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&addressdetails=1&limit=5&countrycodes=in`,
                        { headers: { 'Accept-Language': 'en' } }
                    );
                    const data = await response.json();
                    return data.map((item: any) => ({
                        id: `osm-${item.place_id}`,
                        display_name: item.display_name,
                        lat: parseFloat(item.lat),
                        lon: parseFloat(item.lon),
                        address: item.address,
                        source: 'osm'
                    }));
                })(),
                new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 3000))
            ]);

            if (nominatimResults.length > 0) {
                setResults(nominatimResults);
                setLoading(false);
                return;
            }

            // 3. Last resort: Common Cities filter
            console.log('[LocationSearch] Final fallback: Common Cities');
            const filtered = commonCities.filter(c => 
                c.display_name.toLowerCase().includes(searchText.toLowerCase())
            );
            setResults(filtered);
            if (filtered.length === 0) setError('No results found. Try another city.');

        } catch (err) {
            console.error('[LocationSearch] Search failed:', err);
            setError('Search failed. Using manual backup.');
            // Even on error, show common cities that match
            const filtered = commonCities.filter(c => 
                c.display_name.toLowerCase().includes(searchText.toLowerCase())
            );
            setResults(filtered);
        } finally {
            setLoading(false);
        }
    };

    // Auto-search on type
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query && query.length >= 3 && query !== lastSearchedQuery.current) {
                lastSearchedQuery.current = query;
                performSearch(query);
            }
        }, 600);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = async (item: any) => {
        setQuery(item.display_name);
        setIsOpen(false);
        lastSearchedQuery.current = item.display_name;
        
        console.log('[LocationSearch] Selected:', item.display_name);

        if (item.source === 'google') {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ placeId: item.place_id }, (res, status) => {
                if (status === 'OK' && res?.[0]) {
                    const r = res[0];
                    let city = '', state = '', pincode = '';
                    r.address_components.forEach((c: any) => {
                        if (c.types.includes('locality')) city = c.long_name;
                        else if (!city && (c.types.includes('administrative_area_level_2') || c.types.includes('administrative_area_level_3'))) city = c.long_name;
                        if (c.types.includes('administrative_area_level_1')) state = c.long_name;
                        if (c.types.includes('postal_code')) pincode = c.long_name;
                    });

                    const finalData = {
                        latitude: r.geometry.location.lat(),
                        longitude: r.geometry.location.lng(),
                        address: r.formatted_address || item.display_name,
                        city: city || item.display_name.split(',')[0], 
                        state: state || 'India', 
                        pincode: pincode || '',
                        placeName: item.display_name
                    };
                    console.log('[LocationSearch] Final Selection Data (Google):', finalData);
                    onSelect(finalData);
                }
            });
        } else if (item.source === 'suggestion') {
            const finalData = {
                latitude: 0,
                longitude: 0,
                address: item.display_name,
                city: item.display_name,
                state: '',
                pincode: '',
                placeName: item.display_name
            };
            console.log('[LocationSearch] Final Selection Data (Suggestion):', finalData);
            onSelect(finalData);
        } else {
            // Handle OSM or Common Cities
            const city = item.city || item.address?.city || item.address?.town || item.address?.district || item.display_name.split(',')[0];
            const state = item.state || item.address?.state || 'India';
            const pincode = item.pincode || item.address?.postcode || '';

            const finalData = {
                latitude: item.lat,
                longitude: item.lon,
                address: item.display_name,
                city: city || item.display_name.split(',')[0],
                state: state || 'India',
                pincode: pincode || '',
                placeName: item.display_name
            };
            console.log('[LocationSearch] Final Selection Data (OSM/Common):', finalData);
            onSelect(finalData);
        }
    };

    return (
        <div ref={wrapperRef} className={`relative w-full ${className}`}>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        value={query || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            setQuery(val);
                            setIsOpen(true);
                            if (val.length >= 3) performSearch(val);
                        }}
                        onFocus={() => query?.length >= 3 && setIsOpen(true)}
                        placeholder={placeholder}
                        className="w-full bg-neutral-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                    />
                </div>
                {!hideFindButton && (
                    <button 
                        onClick={() => performSearch(query)}
                        className="bg-neutral-900 text-white px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors"
                    >
                        Find
                    </button>
                )}
            </div>

            {isOpen && (results.length > 0 || loading || error) && (
                <div className="absolute top-full left-0 right-0 z-[9999] mt-2 bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden min-h-[50px]">
                    {loading && results.length === 0 ? (
                        <div className="p-4 flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin text-teal-500" />
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Searching...</span>
                        </div>
                    ) : (
                        <>
                            <div className="max-h-[250px] overflow-y-auto">
                                {results.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        className="w-full px-4 py-3 text-left hover:bg-neutral-50 border-b border-neutral-50 last:border-none flex items-start gap-3 group"
                                    >
                                        <MapPin size={14} className="mt-1 text-neutral-300 group-hover:text-teal-500" />
                                        <div>
                                            <p className="text-xs font-black text-neutral-800 line-clamp-1">{item.display_name.split(',')[0]}</p>
                                            <p className="text-[9px] font-bold text-neutral-400 line-clamp-1 uppercase tracking-wider">{item.display_name.split(',').slice(1).join(',').trim()}</p>
                                        </div>
                                    </button>
                                ))}
                                {results.length === 0 && !loading && !error && (
                                    <div className="p-4 text-[10px] font-bold text-neutral-400 uppercase text-center">No results found</div>
                                )}
                            </div>
                            {error && (
                                <div className="p-2 bg-red-50 text-[8px] font-bold text-red-400 uppercase text-center border-t border-red-100">
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default GenericLocationAutocomplete;

