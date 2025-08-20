import { QueryClient } from '@tanstack/react-query';

// Configure React Query with optimized settings for performance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - data is considered fresh for this duration
      staleTime: 5 * 60 * 1000, // 5 minutes for most data
      
      // Cache time - how long unused queries stay in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      
      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors or client errors (4xx)
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 2;
      },
      
      // Refetch configuration
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      
      // Network mode configuration
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once on network errors
      retry: 1,
      networkMode: 'online',
    },
  },
});

// Query keys factory for consistent cache management
export const queryKeys = {
  // Analytics queries - longer cache times
  analytics: {
    all: ['analytics'] as const,
    dashboard: (dateRange?: { start: Date; end: Date }) => 
      ['analytics', 'dashboard', dateRange] as const,
    realtime: () => ['analytics', 'realtime'] as const,
    performance: () => ['analytics', 'performance'] as const,
    reports: (type: string) => ['analytics', 'reports', type] as const,
  },
  
  // Artisan queries - medium cache times
  artisans: {
    all: ['artisans'] as const,
    list: (filters?: Record<string, string | number | boolean>) => ['artisans', 'list', filters] as const,
    profile: (id: string) => ['artisans', 'profile', id] as const,
    portfolio: (id: string) => ['artisans', 'portfolio', id] as const,
    reviews: (id: string) => ['artisans', 'reviews', id] as const,
    availability: (id: string) => ['artisans', 'availability', id] as const,
  },
  
  // Booking queries - short cache times (real-time data)
  bookings: {
    all: ['bookings'] as const,
    list: (userId?: string, status?: string) => 
      ['bookings', 'list', userId, status] as const,
    detail: (id: string) => ['bookings', 'detail', id] as const,
    timeline: (id: string) => ['bookings', 'timeline', id] as const,
  },
  
  // User queries - medium cache times
  users: {
    all: ['users'] as const,
    profile: (id: string) => ['users', 'profile', id] as const,
    preferences: (id: string) => ['users', 'preferences', id] as const,
  },
  
  // Static data - very long cache times
  static: {
    categories: ['static', 'categories'] as const,
    cities: ['static', 'cities'] as const,
    config: ['static', 'config'] as const,
  },
} as const;

// Cache time configurations for different data types
export const cacheConfig = {
  // Real-time data - short cache times
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  },
  
  // Analytics data - longer cache times
  analytics: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  
  // Static data - very long cache times
  static: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // User-specific data - medium cache times
  user: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  
  // Frequently changing data - short cache times
  dynamic: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
} as const;

// Helper functions for cache management
export const cacheUtils = {
  // Invalidate all analytics queries
  invalidateAnalytics: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
  },
  
  // Invalidate artisan data
  invalidateArtisan: (artisanId?: string) => {
    if (artisanId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.artisans.profile(artisanId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.artisans.all });
    }
  },
  
  // Invalidate booking data
  invalidateBookings: (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.list(userId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    }
  },
  
  // Prefetch critical data
  prefetchCriticalData: async () => {
    const promises = [
      // Prefetch service categories
      queryClient.prefetchQuery({
        queryKey: queryKeys.static.categories,
        queryFn: () => import('@/data/serviceCategories').then(m => m.serviceCategories),
        ...cacheConfig.static,
      }),
      
      // Prefetch cities
      queryClient.prefetchQuery({
        queryKey: queryKeys.static.cities,
        queryFn: () => ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan'],
        ...cacheConfig.static,
      }),
    ];
    
    await Promise.allSettled(promises);
  },
  
  // Clear expired cache entries
  clearExpiredCache: () => {
    queryClient.getQueryCache().clear();
  },
  
  // Get cache stats for monitoring
  getCacheStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      fetchingQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      memoryUsage: queries.reduce((acc, q) => acc + JSON.stringify(q.state.data || {}).length, 0),
    };
  },
} as const;