import { cn } from '@/lib/utils';
import ogaJobsLogo from '@/assets/ogajobs-logo.png';

interface LogoProps {
  variant?: 'icon' | 'full';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  xs: 'h-6',
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
  xl: 'h-16',
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

  if (variant === 'icon') {
    return (
      <div className={cn('flex items-center', className)}>
        <img 
          src={ogaJobsLogo}
          alt="OgaJobs" 
          className={cn(logoSize, 'object-contain w-auto')}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden text-primary font-bold text-center">OJ</div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img 
        src={ogaJobsLogo}
        alt="OgaJobs Logo" 
        className={cn(logoSize, 'object-contain w-auto')}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <div className="hidden text-primary font-bold">OgaJobs</div>
      {showText && (
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-semibold truncate">
            Nigeria's Trust Infrastructure
          </p>
        </div>
      )}
    </div>
  );
}