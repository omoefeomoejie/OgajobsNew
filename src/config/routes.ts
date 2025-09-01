/**
 * Centralized routing configuration for OgaJobs
 * Single source of truth for all application routes
 */

// Route constants
export const ROUTES = {
  // Public routes
  HOME: '/',
  AUTH: '/auth',
  HOW_IT_WORKS: '/how-it-works',
  BECOME_ARTISAN: '/become-artisan',
  HELP_CENTER: '/help-center',
  SAFETY_GUIDELINES: '/safety-guidelines',
  POS_PARTNERSHIP: '/pos-partnership',
  COMPETITIVE_ADVANTAGES: '/competitive-advantages',

  // Legal pages
  PRIVACY_POLICY: '/privacy-policy',
  TERMS_OF_SERVICE: '/terms-of-service',
  COOKIE_POLICY: '/cookie-policy',

  // Main application routes
  DASHBOARD: '/dashboard',
  SERVICES: '/services', // Consolidated from /all-services, /service-directory
  BOOK: '/book',
  BOOKINGS: '/my-bookings',
  FAVORITES: '/favorites',
  MESSAGES: '/messages',
  REVIEWS: '/reviews',
  CALENDAR: '/calendar',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  
  // Artisan routes
  PORTFOLIO: '/portfolio',
  PORTFOLIO_VIEW: '/portfolio/:portfolioId',
  VERIFICATION: '/verification',
  DISPUTES: '/disputes',

  // Agent routes
  AGENT_REGISTRATION: '/agent-registration',
  AGENT_DASHBOARD: '/agent-dashboard',
  AGENT_CHAT: '/agent-chat',

  // Admin routes - all consolidated under /admin/*
  ADMIN: {
    LOGIN: '/admin/login',
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    FINANCIAL_REPORTS: '/admin/financial-reports',
    MONITORING: '/admin/monitoring',
  },

  // Special routes
  PAYMENT_SUCCESS: '/payment-success',
  NOT_FOUND: '*',
} as const;

// Legacy route redirects
export const LEGACY_ROUTES = {
  '/all-services': ROUTES.SERVICES,
  '/service-directory': ROUTES.SERVICES,
  '/admin-dashboard': ROUTES.ADMIN.DASHBOARD,
  '/admin-login': ROUTES.ADMIN.LOGIN,
  '/ojssytem-admin': ROUTES.ADMIN.LOGIN, // Legacy admin login route
  '/monitoring-dashboard': ROUTES.ADMIN.MONITORING,
} as const;

// Route metadata for validation and navigation
export interface RouteConfig {
  path: string;
  title: string;
  description?: string;
  requiresAuth?: boolean;
  roles?: string[];
  isPublic?: boolean;
}

export const ROUTE_CONFIG: Record<string, RouteConfig> = {
  [ROUTES.HOME]: {
    path: ROUTES.HOME,
    title: 'OgaJobs - Find Trusted Artisans',
    description: 'Connect with verified skilled artisans in Nigeria',
    isPublic: true,
  },
  [ROUTES.SERVICES]: {
    path: ROUTES.SERVICES,
    title: 'Browse Services',
    description: 'Find verified artisans for any service you need',
    isPublic: true,
  },
  [ROUTES.DASHBOARD]: {
    path: ROUTES.DASHBOARD,
    title: 'Dashboard',
    requiresAuth: true,
  },
  [ROUTES.ADMIN.DASHBOARD]: {
    path: ROUTES.ADMIN.DASHBOARD,
    title: 'Admin Dashboard',
    requiresAuth: true,
    roles: ['admin', 'super_admin'],
  },
  // Add more route configs as needed
};

// Navigation helpers
export const getRouteTitle = (path: string): string => {
  return ROUTE_CONFIG[path]?.title || 'OgaJobs';
};

export const isProtectedRoute = (path: string): boolean => {
  return ROUTE_CONFIG[path]?.requiresAuth || false;
};

export const hasRequiredRole = (path: string, userRole?: string): boolean => {
  const route = ROUTE_CONFIG[path];
  if (!route?.roles || !userRole) return true;
  return route.roles.includes(userRole);
};

// Mobile navigation configurations by role
export const getMobileNavItems = (role?: string) => {
  const baseItems = [
    { title: 'Home', url: ROUTES.DASHBOARD, icon: 'Home' },
    { title: 'Find', url: ROUTES.SERVICES, icon: 'Search' },
  ];

  switch (role) {
    case 'client':
      return [
        ...baseItems,
        { title: 'Bookings', url: ROUTES.BOOKINGS, icon: 'Calendar' },
        { title: 'Profile', url: ROUTES.PROFILE, icon: 'User' },
      ];

    case 'artisan':
      return [
        { title: 'Home', url: ROUTES.DASHBOARD, icon: 'Home' },
        { title: 'Bookings', url: ROUTES.BOOKINGS, icon: 'Briefcase' },
        { title: 'Messages', url: ROUTES.MESSAGES, icon: 'MessageSquare' },
        { title: 'Verify', url: ROUTES.VERIFICATION, icon: 'Shield' },
        { title: 'Profile', url: ROUTES.PROFILE, icon: 'User' },
      ];

    case 'admin':
    case 'super_admin':
      return [
        { title: 'Home', url: ROUTES.DASHBOARD, icon: 'Home' },
        { title: 'Messages', url: ROUTES.MESSAGES, icon: 'MessageSquare' },
        { title: 'Settings', url: ROUTES.SETTINGS, icon: 'Settings' },
        { title: 'Admin', url: ROUTES.ADMIN.DASHBOARD, icon: 'Shield' },
      ];

    default:
      return [
        { title: 'Home', url: ROUTES.DASHBOARD, icon: 'Home' },
        { title: 'Profile', url: ROUTES.PROFILE, icon: 'User' },
      ];
  }
};