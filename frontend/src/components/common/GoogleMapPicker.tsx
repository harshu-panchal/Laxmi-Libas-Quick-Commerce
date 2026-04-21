import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, Autocomplete } from '@react-google-maps/api';

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

interface GoogleMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialRadius?: number;
  onLocationChange: (lat: number, lng: number, address: string) => void;
  onRadiusChange: (radius: number) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px',
};

const defaultCenter = {
  lat: 28.6139, // Delhi
  lng: 77.2090,
};

const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({
  initialLat,
  initialLng,
  initialRadius = 10,
  onLocationChange,
  onRadiusChange,
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const [center, setCenter] = useState({
    lat: initialLat || defaultCenter.lat,
    lng: initialLng || defaultCenter.lng,
  });

  const [markerPos, setMarkerPos] = useState({
    lat: initialLat || defaultCenter.lat,
    lng: initialLng || defaultCenter.lng,
  });

  const [radius, setRadius] = useState(initialRadius);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      setMarkerPos({ lat: newLat, lng: newLng });
      updateAddress(newLat, newLng);
    }
  }, []);

  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      setMarkerPos({ lat: newLat, lng: newLng });
      updateAddress(newLat, newLng);
    }
  };

  const updateAddress = async (lat: number, lng: number) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        onLocationChange(lat, lng, results[0].formatted_address);
      } else {
        onLocationChange(lat, lng, "");
      }
    });
  };

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.ref = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const newLat = place.geometry.location.lat();
        const newLng = place.geometry.location.lng();
        setCenter({ lat: newLat, lng: newLng });
        setMarkerPos({ lat: newLat, lng: newLng });
        onLocationChange(newLat, newLng, place.formatted_address || "");
      }
    }
  };

  return isLoaded ? (
    <div className="space-y-4">
      <div className="relative">
        <Autocomplete
          onLoad={(ref) => (autocompleteRef.current = ref)}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            type="text"
            placeholder="Search your shop location..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          />
        </Autocomplete>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        onClick={onMapClick}
        options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
        }}
      >
        <Marker
          position={markerPos}
          draggable={true}
          onDragEnd={onMarkerDragEnd}
          animation={google.maps.Animation.DROP}
        />
        <Circle
          center={markerPos}
          radius={radius * 1000} // Convert km to meters
          options={{
            fillColor: '#3B82F6',
            fillOpacity: 0.2,
            strokeColor: '#3B82F6',
            strokeOpacity: 0.5,
            strokeWeight: 2,
            clickable: false,
          }}
        />
      </GoogleMap>

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-semibold text-blue-900">Delivery Radius: {radius} km</label>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={radius}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            setRadius(val);
            onRadiusChange(val);
          }}
          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-[10px] text-blue-500 mt-1">
          <span>1 km</span>
          <span>100 km</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Latitude</p>
          <p className="text-sm font-mono text-gray-700">{markerPos.lat.toFixed(6)}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Longitude</p>
          <p className="text-sm font-mono text-gray-700">{markerPos.lng.toFixed(6)}</p>
        </div>
      </div>
    </div>
  ) : (
    <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
      <p className="text-gray-400 font-medium">Loading Interactive Map...</p>
    </div>
  );
};

export default GoogleMapPicker;
