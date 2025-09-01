import { cn } from '@/lib/utils';
import ogaJobsLogo from '@/assets/ogajobs-logo.png';

interface LogoProps {
  variant?: 'icon' | 'full';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const textSizeClasses = {
  xs: 'text-sm',
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

export function Logo({ 
  variant = 'full', 
  size = 'md', 
  className, 
  showText = true 
}: LogoProps) {
  const logoSize = sizeClasses[size];
  const textSize = textSizeClasses[size];

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.warn('Logo failed to load, hiding image');
    e.currentTarget.style.display = 'none';
  };

  if (variant === 'icon') {
    return (
      <img 
        src={ogaJobsLogo}
        alt="OgaJobs" 
        className={cn(
          logoSize,
          'object-contain aspect-square',
          className
        )}
        loading="lazy"
        onError={handleImageError}
      />
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img 
        src={ogaJobsLogo}
        alt="OgaJobs Logo" 
        className={cn(logoSize, 'object-contain aspect-square')}
        loading="lazy"
        onError={handleImageError}
      />
      {showText && (
        <div className="min-w-0">
          <h1 className={cn(textSize, 'font-black text-foreground tracking-tight')}>
            OgaJobs
          </h1>
          <p className="text-xs text-muted-foreground font-semibold truncate">
            Nigeria's Trust Infrastructure
          </p>
        </div>
      )}
    </div>
  );
}