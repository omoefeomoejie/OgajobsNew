import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
  loading?: 'eager' | 'lazy';
  onLoad?: () => void;
  onError?: () => void;
}

// Generate blur placeholder SVG
const generateBlurPlaceholder = (width: number, height: number): string => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(var(--muted));stop-opacity:0.5" />
          <stop offset="100%" style="stop-color:hsl(var(--muted-foreground));stop-opacity:0.3" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Progressive image component with optimization
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  quality = 85,
  loading = 'lazy',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Generate optimized image URLs (for future CDN integration)
  const optimizedSrc = useMemo(() => {
    // For now, return original src
    // In production, this would generate URLs for different sizes/formats
    return src;
  }, [src, width, height, quality]);

  // Generate blur placeholder
  const placeholderSrc = useMemo(() => {
    if (blurDataURL) return blurDataURL;
    if (placeholder === 'blur' && width && height) {
      return generateBlurPlaceholder(width, height);
    }
    return undefined;
  }, [blurDataURL, placeholder, width, height]);

  // Preload image
  useEffect(() => {
    if (priority || loading === 'eager') {
      const img = new Image();
      img.src = optimizedSrc;
      img.onload = () => {
        setImageSrc(optimizedSrc);
        setImageLoaded(true);
        onLoad?.();
      };
      img.onerror = () => {
        setImageError(true);
        onError?.();
      };
    }
  }, [optimizedSrc, priority, loading, onLoad, onError]);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (priority || loading === 'eager' || imageLoaded) return;

    const imageElement = document.querySelector(`[data-src="${optimizedSrc}"]`);
    if (!imageElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.src = optimizedSrc;
            img.onload = () => {
              setImageSrc(optimizedSrc);
              setImageLoaded(true);
              onLoad?.();
            };
            img.onerror = () => {
              setImageError(true);
              onError?.();
            };
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(imageElement);

    return () => observer.disconnect();
  }, [optimizedSrc, priority, loading, imageLoaded, onLoad, onError]);

  // Error fallback
  if (imageError) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground rounded',
          className
        )}
        style={{ width, height }}
      >
        <span className="text-sm">Failed to load image</span>
      </div>
    );
  }

  // Show placeholder while loading
  if (!imageLoaded || !imageSrc) {
    return (
      <div
        className={cn('overflow-hidden rounded', className)}
        style={{ width, height }}
        data-src={optimizedSrc}
      >
        {placeholderSrc ? (
          <img
            src={placeholderSrc}
            alt=""
            width={width}
            height={height}
            className="w-full h-full object-cover blur-sm scale-110 transition-all duration-300"
          />
        ) : (
          <div 
            className="w-full h-full bg-muted animate-pulse"
            style={{ width, height }}
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded', className)}>
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={loading}
        className={cn(
          'w-full h-full object-cover transition-all duration-300',
          imageLoaded ? 'blur-0 scale-100' : 'blur-sm scale-110'
        )}
        onLoad={() => {
          setImageLoaded(true);
          onLoad?.();
        }}
        onError={() => {
          setImageError(true);
          onError?.();
        }}
      />
    </div>
  );
}

// Image preloader hook
export function useImagePreloader(urls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const preloadImages = useCallback(async () => {
    if (urls.length === 0) return;

    setLoading(true);
    const loaded = new Set<string>();

    const loadPromises = urls.map((url) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          loaded.add(url);
          resolve();
        };
        img.onerror = () => resolve(); // Continue even if image fails
        img.src = url;
      });
    });

    await Promise.allSettled(loadPromises);
    setLoadedImages(loaded);
    setLoading(false);
  }, [urls]);

  useEffect(() => {
    preloadImages();
  }, [preloadImages]);

  return { loadedImages, loading, preloadImages };
}

// Progressive enhancement for galleries
export function ImageGallery({ 
  images, 
  columns = 3,
  gap = 4,
  className 
}: { 
  images: Array<{ src: string; alt: string; width?: number; height?: number }>;
  columns?: number;
  gap?: number;
  className?: string;
}) {
  const { loadedImages } = useImagePreloader(images.map(img => img.src));

  return (
    <div 
      className={cn('grid gap-4', className)}
      style={{ 
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap * 0.25}rem`
      }}
    >
      {images.map((image, index) => (
        <OptimizedImage
          key={index}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading={index < 6 ? 'eager' : 'lazy'} // Load first 6 eagerly
          priority={index < 3} // High priority for first 3
          className="w-full h-auto"
        />
      ))}
    </div>
  );
}

// Background image with optimization
export function OptimizedBackgroundImage({
  src,
  children,
  className,
  ...props
}: {
  src: string;
  children?: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = src;
  }, [src]);

  return (
    <div 
      className={cn(
        'relative transition-all duration-500',
        imageLoaded ? 'bg-opacity-100' : 'bg-opacity-0',
        className
      )}
      style={{
        backgroundImage: imageLoaded ? `url(${src})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      {...props}
    >
      {!imageLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      {children}
    </div>
  );
}