import { cn } from '@/lib/utils';
import ogaJobsLogoPng from '@/assets/ogajobs-logo-new.png';
import ogaJobsLogoSvg from '@/assets/ogajobs-logo.svg';

interface LogoProps {
  variant?: 'icon' | 'full';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  format?: 'svg' | 'png';
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
  showText = true,
  format = 'svg'
}: LogoProps) {
  const logoSize = sizeClasses[size];
  const textSize = textSizeClasses[size];
  const logoSrc = format === 'svg' ? ogaJobsLogoSvg : ogaJobsLogoPng;

  if (variant === 'icon') {
    return (
      <div className={cn('flex items-center', className)}>
        <img 
          src={logoSrc}
          alt="OgaJobs" 
          className={cn(
            logoSize,
            'object-contain'
          )}
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
        src={logoSrc}
        alt="OgaJobs Logo" 
        className={cn(logoSize, 'object-contain')}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <div className="hidden text-primary font-bold">OgaJobs</div>
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