// Analytics Type Definitions - Replaces any types with proper interfaces

// Analytics Type Definitions with more flexible types for Supabase data

export interface BookingData {
  id: string;
  created_at: string;
  status: string; // More flexible - actual DB has various status values
  work_type: string;
  city: string;
  budget: number;
  client_email: string;
  artisan_id?: string;
  completion_date?: string;
  payment_status: string; // More flexible
}

export interface ArtisanData {
  id: string;
  email: string;
  full_name: string;
  category: string;
  city: string;
  created_at: string;
  suspended: boolean;
  average_rating?: number;
  total_reviews?: number;
}

export interface ReviewData {
  id: string;
  artisan_id: string;
  client_email: string;
  rating: number;
  review?: string;
  created_at: string;
}

export interface PaymentData {
  id: string;
  booking_id: string;
  amount: number;
  platform_fee: number;
  payment_status: string; // More flexible
  created_at: string;
}

export interface AnalyticsOverview {
  totalBookings: number;
  totalRevenue: number;
  activeArtisans: number;
  averageRating: number;
  completionRate: number;
  responseTime: number;
  platformFee: number;
  artisanEarnings: number;
  growthRate: number;
  churnRate: number;
}

export interface RealtimeMetrics {
  activeUsers: number;
  ongoingBookings: number;
  pendingPayments: number;
  lastUpdated: string;
}

export interface TrendData {
  date: string;
  bookings: number;
  revenue: number;
  completed: number;
  cancelled: number;
  users: number;
}

export interface CategoryData {
  category: string;
  count: number;
  revenue: number;
  avgRating: number;
  completionRate: number;
}

export interface GeographicData {
  city: string;
  bookings: number;
  revenue: number;
  artisans: number;
  avgRating: number;
  percentage: number;
}

export interface UserGrowthData {
  month: string;
  artisans: number;
  clients: number;
  retention: number;
}

export interface PerformanceMetrics {
  conversionRate: number;
  averageJobValue: number;
  repeatCustomerRate: number;
  timeToFirstBooking: number;
  disputeRate: number;
  refundRate: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  realTimeMetrics: RealtimeMetrics;
  bookingsTrend: TrendData[];
  categoryBreakdown: CategoryData[];
  userGrowth: UserGrowthData[];
  geographicData: GeographicData[];
  performanceMetrics: PerformanceMetrics;
}

export interface AlertData {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ChartDataPoint {
  name: string;
  value: number;
  label?: string;
  color?: string;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
}

// Error handling types
export interface AnalyticsError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export interface DataFetchOptions {
  startDate?: Date;
  endDate?: Date;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  filters?: Record<string, unknown>;
  cached?: boolean;
}

// API Response types
export interface AnalyticsApiResponse<T = unknown> {
  data: T;
  success: boolean;
  error?: AnalyticsError;
  meta?: {
    total: number;
    page: number;
    limit: number;
    cached: boolean;
    computedAt: string;
  };
}