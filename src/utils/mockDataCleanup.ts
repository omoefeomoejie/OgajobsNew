/**
 * Utility to clean up mock data and replace with proper implementations
 */

// Mock data patterns to identify and replace
export const MOCK_PATTERNS = [
  'mock',
  'Mock',
  'MOCK',
  'placeholder',
  'Placeholder',
  'PLACEHOLDER',
  'temp',
  'temporary',
  'demo',
  'test-data'
] as const;

// Better placeholder implementations
export const PLACEHOLDER_IMPLEMENTATIONS = {
  // User data
  user: {
    name: 'Loading...',
    email: 'user@example.com',
    avatar: '/default-avatar.png',
    role: 'user'
  },
  
  // Service data
  service: {
    name: 'Service details loading...',
    description: 'Loading service information...',
    price: 'Price on request',
    category: 'General Services',
    rating: null
  },
  
  // Booking data
  booking: {
    title: 'Loading booking details...',
    status: 'pending',
    date: new Date().toISOString(),
    price: 'TBD'
  },
  
  // Analytics data - use loading states instead of mock numbers
  analytics: {
    loading: true,
    error: null,
    data: null
  }
} as const;

/**
 * Replace mock data with proper loading states
 */
export function createLoadingState<T>(type: 'user' | 'service' | 'booking' | 'analytics') {
  return {
    loading: true,
    error: null,
    data: PLACEHOLDER_IMPLEMENTATIONS[type] as T
  };
}

/**
 * Create proper empty states instead of mock data
 */
export function createEmptyState(message: string, actionLabel?: string, onAction?: () => void) {
  return {
    isEmpty: true,
    message,
    actionLabel,
    onAction
  };
}

/**
 * Replace mock calculations with proper data fetching
 */
export class DataFetcher<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private cacheTime = 5 * 60 * 1000; // 5 minutes

  async fetch(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTime) {
      return cached.data;
    }

    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`Error fetching data for key ${key}:`, error);
      throw error;
    }
  }

  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

/**
 * Better form placeholder text
 */
export const FORM_PLACEHOLDERS = {
  search: 'Search services, artisans, or locations...',
  email: 'Enter your email address',
  password: 'Enter your password',
  name: 'Enter your full name',
  phone: 'Enter your phone number',
  address: 'Enter your address',
  description: 'Describe your service needs...',
  price: 'Enter amount (₦)',
  date: 'Select date',
  time: 'Select time',
  category: 'Choose service category',
  location: 'Select your location',
  message: 'Type your message...',
  feedback: 'Share your experience...',
  title: 'Enter a title',
  instructions: 'Any special instructions?'
} as const;

/**
 * Error state creators
 */
export function createErrorState(
  message: string, 
  type: 'network' | 'validation' | 'server' | 'not-found' = 'server',
  retry?: () => void
) {
  const errorTypes = {
    network: 'Connection Error',
    validation: 'Validation Error', 
    server: 'Server Error',
    'not-found': 'Not Found'
  };

  return {
    error: true,
    type,
    title: errorTypes[type],
    message,
    retry,
    timestamp: Date.now()
  };
}

/**
 * Success state creators
 */
export function createSuccessState(message: string, data?: any) {
  return {
    success: true,
    message,
    data,
    timestamp: Date.now()
  };
}

/**
 * Progress state for long operations
 */
export function createProgressState(current: number, total: number, message?: string) {
  return {
    loading: true,
    progress: {
      current,
      total,
      percentage: Math.round((current / total) * 100),
      message: message || `${current} of ${total} completed`
    }
  };
}

/**
 * Pagination helpers instead of mock data
 */
export function createPaginationState(
  page: number = 1, 
  limit: number = 10, 
  total: number = 0
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
    offset: (page - 1) * limit
  };
}

/**
 * Real-time data updater instead of mock data
 */
export class RealTimeUpdater<T> {
  private subscribers = new Set<(data: T) => void>();
  private currentData: T | null = null;

  subscribe(callback: (data: T) => void) {
    this.subscribers.add(callback);
    
    // Immediately send current data if available
    if (this.currentData) {
      callback(this.currentData);
    }

    return () => this.subscribers.delete(callback);
  }

  update(data: T) {
    this.currentData = data;
    this.subscribers.forEach(callback => callback(data));
  }

  clear() {
    this.currentData = null;
    this.subscribers.clear();
  }
}