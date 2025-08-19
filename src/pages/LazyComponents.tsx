// Lazy-loaded page components for better performance
import { withLazyLoading } from '@/components/performance/LazyLoadWrapper';

// Dashboard and Admin Components
export const LazyDashboard = withLazyLoading(
  () => import('./Dashboard'),
  { componentName: 'Dashboard', skeletonType: 'card' }
);

export const LazyAdminDashboard = withLazyLoading(
  () => import('./AdminDashboard'),
  { componentName: 'Admin Dashboard', skeletonType: 'table' }
);

export const LazyAdminUsers = withLazyLoading(
  () => import('./AdminUsers'),
  { componentName: 'Admin Users', skeletonType: 'table' }
);

// Service and Booking Components
export const LazyServiceDirectory = withLazyLoading(
  () => import('./ServiceDirectory'),
  { componentName: 'Service Directory', skeletonType: 'list' }
);

export const LazyBookingRequest = withLazyLoading(
  () => import('./BookingRequest'),
  { componentName: 'Booking Request', skeletonType: 'card' }
);

export const LazyMyBookings = withLazyLoading(
  () => import('./MyBookings'),
  { componentName: 'My Bookings', skeletonType: 'list' }
);

// Agent Components
export const LazyAgentRegistration = withLazyLoading(
  () => import('./AgentRegistration'),
  { componentName: 'Agent Registration', skeletonType: 'card' }
);

export const LazyAgentDashboard = withLazyLoading(
  () => import('./AgentDashboard'),
  { componentName: 'Agent Dashboard', skeletonType: 'card' }
);

export const LazyAgentChatDashboard = withLazyLoading(
  () => import('./AgentChatDashboard'),
  { componentName: 'Agent Chat Dashboard', skeletonType: 'list' }
);

// Profile and Portfolio Components
export const LazyProfile = withLazyLoading(
  () => import('./Profile'),
  { componentName: 'Profile', skeletonType: 'card' }
);

export const LazyPortfolio = withLazyLoading(
  () => import('./Portfolio'),
  { componentName: 'Portfolio', skeletonType: 'card' }
);

export const LazyPortfolioView = withLazyLoading(
  () => import('./PortfolioView'),
  { componentName: 'Portfolio View', skeletonType: 'card' }
);

// Communication Components
export const LazyMessages = withLazyLoading(
  () => import('./Messages'),
  { componentName: 'Messages', skeletonType: 'list' }
);

export const LazyDisputes = withLazyLoading(
  () => import('./Disputes'),
  { componentName: 'Disputes', skeletonType: 'list' }
);

// Other Components
export const LazyReviews = withLazyLoading(
  () => import('./Reviews'),
  { componentName: 'Reviews', skeletonType: 'list' }
);

export const LazySettings = withLazyLoading(
  () => import('./Settings'),
  { componentName: 'Settings', skeletonType: 'card' }
);

export const LazyVerification = withLazyLoading(
  () => import('./Verification'),
  { componentName: 'Verification', skeletonType: 'card' }
);

export const LazyFavorites = withLazyLoading(
  () => import('./Favorites'),
  { componentName: 'Favorites', skeletonType: 'list' }
);

export const LazyServices = withLazyLoading(
  () => import('./Services'),
  { componentName: 'Services', skeletonType: 'list' }
);

export const LazyHelpCenter = withLazyLoading(
  () => import('./HelpCenter'),
  { componentName: 'Help Center', skeletonType: 'card' }
);

export const LazyPOSPartnership = withLazyLoading(
  () => import('./POSPartnership'),
  { componentName: 'POS Partnership', skeletonType: 'card' }
);

export const LazyCompetitiveAdvantages = withLazyLoading(
  () => import('./CompetitiveAdvantages'),
  { componentName: 'Competitive Advantages', skeletonType: 'card' }
);

export const LazySafetyGuidelines = withLazyLoading(
  () => import('./SafetyGuidelines'),
  { componentName: 'Safety Guidelines', skeletonType: 'card' }
);

export const LazyHowItWorks = withLazyLoading(
  () => import('./HowItWorks'),
  { componentName: 'How It Works', skeletonType: 'card' }
);

export const LazyBecomeArtisan = withLazyLoading(
  () => import('./BecomeArtisan'),
  { componentName: 'Become Artisan', skeletonType: 'card' }
);
