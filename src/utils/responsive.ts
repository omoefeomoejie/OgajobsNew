/**
 * Standardized responsive utilities for consistent breakpoint usage across the app
 */

// Standard breakpoint definitions (matching Tailwind defaults)
export const BREAKPOINTS = {
  sm: '640px',   // Small devices (landscape phones)
  md: '768px',   // Medium devices (tablets)
  lg: '1024px',  // Large devices (laptops)
  xl: '1280px',  // Extra large devices (desktop)
  '2xl': '1536px' // 2X large devices (large desktop)
} as const;

// Standard responsive grid patterns
export const RESPONSIVE_GRIDS = {
  // Cards/Content grids
  cards: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  cardsMd: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  cardsLg: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  
  // Dashboard grids
  dashboard: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  dashboardMetrics: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6',
  
  // Form grids
  form: 'grid-cols-1 md:grid-cols-2',
  formLarge: 'grid-cols-1 lg:grid-cols-3',
  
  // List grids
  list: 'grid-cols-1',
  listWide: 'grid-cols-1 lg:grid-cols-2',
  
  // Service/Category grids
  services: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  categories: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
} as const;

// Standard spacing patterns
export const RESPONSIVE_SPACING = {
  section: 'py-8 md:py-12 lg:py-16',
  container: 'px-4 sm:px-6 lg:px-8',
  gap: 'gap-4 md:gap-6 lg:gap-8',
  gapSmall: 'gap-2 md:gap-4',
  gapLarge: 'gap-6 md:gap-8 lg:gap-12'
} as const;

// Text size patterns
export const RESPONSIVE_TEXT = {
  hero: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl',
  heading: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
  subheading: 'text-lg sm:text-xl md:text-2xl',
  body: 'text-sm sm:text-base',
  small: 'text-xs sm:text-sm'
} as const;

// Component size patterns
export const RESPONSIVE_SIZES = {
  button: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm md:text-base',
    lg: 'px-6 py-3 text-base md:text-lg'
  },
  input: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm md:text-base',
    lg: 'px-4 py-3 text-base md:text-lg'
  },
  avatar: {
    sm: 'h-8 w-8',
    md: 'h-10 w-10 md:h-12 md:w-12',
    lg: 'h-12 w-12 md:h-16 md:w-16'
  }
} as const;

// Mobile-first utilities
export const MOBILE_UTILITIES = {
  hide: 'hidden md:block',
  show: 'block md:hidden',
  hideOnMobile: 'hidden sm:block',
  showOnMobile: 'block sm:hidden',
  stack: 'flex flex-col md:flex-row',
  center: 'mx-auto text-center md:text-left',
  fullWidth: 'w-full md:w-auto'
} as const;

// Safe area utilities for mobile devices
export const SAFE_AREA = {
  top: 'pt-safe-top',
  bottom: 'pb-safe-bottom',
  insetX: 'px-safe-x',
  insetY: 'py-safe-y',
  inset: 'p-safe'
} as const;

/**
 * Get responsive classes for common patterns
 */
export const getResponsiveClasses = {
  grid: (type: keyof typeof RESPONSIVE_GRIDS = 'cards') => 
    `grid ${RESPONSIVE_GRIDS[type]} ${RESPONSIVE_SPACING.gap}`,
    
  container: (padding = true) => 
    `container mx-auto ${padding ? RESPONSIVE_SPACING.container : ''}`,
    
  section: (spacing = true) => 
    `${spacing ? RESPONSIVE_SPACING.section : ''} ${RESPONSIVE_SPACING.container}`,
    
  card: () => 
    'rounded-lg border bg-card text-card-foreground shadow-sm p-4 md:p-6',
    
  button: (size: keyof typeof RESPONSIVE_SIZES.button = 'md') =>
    `inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${RESPONSIVE_SIZES.button[size]}`,
    
  input: (size: keyof typeof RESPONSIVE_SIZES.input = 'md') =>
    `flex w-full rounded-md border border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${RESPONSIVE_SIZES.input[size]}`
};

/**
 * Check if we're on mobile based on viewport
 */
export const isMobileViewport = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768; // md breakpoint
};

/**
 * Get optimal column count based on viewport and item count
 */
export const getOptimalColumns = (itemCount: number, maxCols = 4) => {
  if (typeof window === 'undefined') return 1;
  
  const width = window.innerWidth;
  
  if (width < 640) return 1; // sm
  if (width < 768) return Math.min(2, itemCount, maxCols); // md
  if (width < 1024) return Math.min(3, itemCount, maxCols); // lg
  
  return Math.min(maxCols, itemCount);
};