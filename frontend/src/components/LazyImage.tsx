import { useState, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  [key: string]: any;
}

/**
 * High-performance Progressive Loading Image component
 * Programmatically preloads images to ensure reliability under all scrolling conditions,
 * bypassing native browser lazy-loading bugs in scrollable elements/flex grids.
 */
export default function LazyImage({
  src,
  alt,
  className = '',
  placeholder,
  onError,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Programmatically preload image to bypass browser lazy viewport issues
  useEffect(() => {
    if (!src) {
      setIsLoaded(false);
      setHasError(false);
      return;
    }

    setIsLoaded(false);
    setHasError(false);

    const img = new Image();
    img.src = src;
    img.onload = () => {
      setIsLoaded(true);
    };
    img.onerror = () => {
      setHasError(true);
    };
  }, [src]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-neutral-100 flex items-center justify-center">
      {/* Premium CSS Shimmer Skeleton State */}
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-100 bg-[length:200%_100%]" 
          style={{
            animation: 'shimmer 1.5s infinite linear',
          }}
        />
      )}

      {/* Fallback Error Display */}
      {hasError && (
        <div className="absolute inset-0 bg-neutral-50 flex flex-col items-center justify-center p-2 text-center text-[10px] font-black text-neutral-400 uppercase tracking-wider">
          ⚠️ Image Error
        </div>
      )}

      <img
        src={src || placeholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E'}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} transition-all duration-300 ease-out`}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          setHasError(true);
          if (onError) onError(e);
        }}
        {...props}
      />

      {/* Embedded Shimmer Animation Keyframe */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
