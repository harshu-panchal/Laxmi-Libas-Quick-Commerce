import { useState, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  [key: string]: any;
}

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

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-neutral-50 flex items-center justify-center">
      {/* Fast CSS Pulse Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-neutral-100 animate-pulse" />
      )}

      {/* Fallback Error Display */}
      {hasError && (
        <div className="absolute inset-0 bg-neutral-50 flex flex-col items-center justify-center p-2 text-center text-[10px] font-black text-neutral-400 uppercase tracking-wider">
          ⚠️
        </div>
      )}

      <img
        src={src || placeholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E'}
        alt={alt}
        className={`${className} relative z-10 transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          setHasError(true);
          if (onError) onError(e);
        }}
        {...props}
      />
    </div>
  );
}
