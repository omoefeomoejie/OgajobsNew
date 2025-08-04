import { useState, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: boolean;
  quality?: number;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = true,
  quality = 75,
  sizes,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');

  // Create optimized image URL
  const createOptimizedUrl = useCallback((originalSrc: string) => {
    // If it's already a data URL or external URL, return as is
    if (originalSrc.startsWith('data:') || originalSrc.startsWith('http')) {
      return originalSrc;
    }

    // For local images, we could integrate with a service like Cloudinary
    // For now, just return the original src
    return originalSrc;
  }, []);

  // Progressive loading with blur effect
  const createPlaceholder = useCallback((src: string) => {
    // Create a tiny, blurred version for placeholder
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-size="14">
          Loading...
        </text>
      </svg>
    `)}`;
  }, [width, height]);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(createOptimizedUrl(src));
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      onError?.();
    };

    if (priority) {
      // Load immediately for priority images
      img.src = src;
    } else {
      // Lazy loading for non-priority images
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            img.src = src;
            observer.disconnect();
          }
        },
        { rootMargin: '50px' }
      );

      const element = document.createElement('div');
      observer.observe(element);
      
      return () => observer.disconnect();
    }
  }, [src, priority, createOptimizedUrl, onLoad, onError]);

  if (hasError) {
    return (
      <div 
        className={cn(
          "bg-muted flex items-center justify-center text-muted-foreground",
          className
        )}
        style={{ width, height }}
      >
        <span className="text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && placeholder && (
        <Skeleton 
          className={cn("absolute inset-0", className)}
          style={{ width, height }}
        />
      )}
      
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      )}
    </div>
  );
}

// Hook for image preloading
export function useImagePreloader(urls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const preloadImage = (url: string) => {
      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(url));
      };
      img.src = url;
    };

    urls.forEach(preloadImage);
  }, [urls]);

  return loadedImages;
}

// Component for progressive image enhancement
export function ProgressiveImage({
  src,
  alt,
  lowQualitySrc,
  ...props
}: OptimizedImageProps & { lowQualitySrc?: string }) {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc || src);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  useEffect(() => {
    if (!lowQualitySrc) return;

    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setIsHighQualityLoaded(true);
    };
    img.src = src;
  }, [src, lowQualitySrc]);

  return (
    <OptimizedImage
      {...props}
      src={currentSrc}
      alt={alt}
      className={cn(
        props.className,
        !isHighQualityLoaded && lowQualitySrc && "filter blur-sm scale-105"
      )}
    />
  );
}