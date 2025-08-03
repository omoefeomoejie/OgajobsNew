import { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { useMobile } from '@/hooks/useMobile';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const { isMobile } = useMobile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxPullDistance = 80;
  const triggerDistance = 60;

  useEffect(() => {
    if (!isMobile) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        setStartY(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY === 0 || container.scrollTop > 0) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 0) {
        e.preventDefault();
        const distance = Math.min(diff * 0.5, maxPullDistance);
        setPullDistance(distance);
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance >= triggerDistance && !isRefreshing) {
        handleRefresh();
      }
      
      setStartY(0);
      setPullDistance(0);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, startY, pullDistance, isRefreshing]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshOpacity = Math.min(pullDistance / triggerDistance, 1);
  const refreshScale = Math.min(pullDistance / triggerDistance, 1);

  return (
    <div ref={containerRef} className="relative h-full overflow-auto">
      {/* Pull to refresh indicator */}
      {isMobile && pullDistance > 0 && (
        <div 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50 transition-transform duration-200"
          style={{ 
            transform: `translateX(-50%) translateY(${pullDistance - 40}px)`,
            opacity: refreshOpacity 
          }}
        >
          <div className="bg-background/90 backdrop-blur rounded-full p-3 shadow-lg border">
            <RefreshCw 
              className={`h-5 w-5 text-primary transition-transform duration-200 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              style={{ 
                transform: `scale(${refreshScale}) rotate(${pullDistance * 2}deg)` 
              }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div 
        style={{ 
          transform: `translateY(${Math.min(pullDistance * 0.3, 20)}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
}