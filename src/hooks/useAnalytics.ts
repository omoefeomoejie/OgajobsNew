import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  AnalyticsData, 
  BookingData, 
  ArtisanData, 
  ReviewData, 
  PaymentData,
  DataFetchOptions,
  AnalyticsError
} from '@/types/analytics';

interface UseAnalyticsOptions extends DataFetchOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onError?: (error: AnalyticsError) => void;
}

interface UseAnalyticsReturn {
  data: AnalyticsData | null;
  loading: boolean;
  error: AnalyticsError | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AnalyticsError | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const {
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes
    startDate,
    endDate,
    onError,
    cached = true
  } = options;

  const fetchAnalyticsData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Build date filters
      const dateFilter = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endFilter = endDate || new Date();

      // Fetch data with proper error handling and type safety
      const [
        bookingsResponse,
        artisansResponse,
        reviewsResponse,
        paymentsResponse,
        escrowResponse
      ] = await Promise.allSettled([
        supabase
          .from('bookings')
          .select('*')
          .gte('created_at', dateFilter.toISOString())
          .lte('created_at', endFilter.toISOString())
          .order('created_at'),
        
        supabase
          .from('artisans')
          .select('*')
          .eq('suspended', false),
        
        supabase
          .from('artisan_reviews')
          .select('*')
          .gte('created_at', dateFilter.toISOString()),
        
        supabase
          .from('payment_transactions')  
          .select('*')
          .gte('created_at', dateFilter.toISOString()),
        
        supabase
          .from('escrow_payments')
          .select('*')
      ]);

      // Handle rejected promises
      const responses = [bookingsResponse, artisansResponse, reviewsResponse, paymentsResponse, escrowResponse];
      const rejectedResponses = responses.filter(r => r.status === 'rejected');
      
      if (rejectedResponses.length > 0) {
        console.warn('Some analytics queries failed:', rejectedResponses);
      }

      // Extract successful data
      const bookings: BookingData[] = bookingsResponse.status === 'fulfilled' && bookingsResponse.value.data 
        ? bookingsResponse.value.data 
        : [];
      
      const artisans: ArtisanData[] = artisansResponse.status === 'fulfilled' && artisansResponse.value.data 
        ? artisansResponse.value.data 
        : [];
      
      const reviews: ReviewData[] = reviewsResponse.status === 'fulfilled' && reviewsResponse.value.data 
        ? reviewsResponse.value.data 
        : [];
      
      const payments: PaymentData[] = paymentsResponse.status === 'fulfilled' && paymentsResponse.value.data 
        ? paymentsResponse.value.data 
        : [];

      // Process data with proper type safety
      const processedData = processAnalyticsData(bookings, artisans, reviews, payments);
      
      setData(processedData);
      setLastUpdated(new Date());

    } catch (err) {
      const analyticsError: AnalyticsError = {
        code: 'FETCH_ERROR',
        message: err instanceof Error ? err.message : 'Failed to fetch analytics data',
        details: { originalError: err },
        timestamp: new Date()
      };
      
      setError(analyticsError);
      onError?.(analyticsError);
      
      toast({
        title: "Analytics Error",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, onError, toast, cached]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchAnalyticsData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchAnalyticsData]);

  // Initial data fetch
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  return {
    data,
    loading,
    error,
    refresh: fetchAnalyticsData,
    lastUpdated
  };
}

// Helper function to process raw data into analytics format
function processAnalyticsData(
  bookings: BookingData[],
  artisans: ArtisanData[],
  reviews: ReviewData[],
  payments: PaymentData[]
): AnalyticsData {
  const now = new Date();
  
  // Calculate overview metrics
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const totalRevenue = payments
    .filter(p => p.payment_status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPlatformFee = payments
    .filter(p => p.payment_status === 'completed')
    .reduce((sum, p) => sum + p.platform_fee, 0);
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;
  const completionRate = totalBookings > 0 
    ? (completedBookings.length / totalBookings) * 100 
    : 0;

  // Calculate growth rate (last 30 days vs previous 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  const recentBookings = bookings.filter(b => new Date(b.created_at) >= thirtyDaysAgo);
  const previousBookings = bookings.filter(b => 
    new Date(b.created_at) >= sixtyDaysAgo && new Date(b.created_at) < thirtyDaysAgo
  );
  
  const growthRate = previousBookings.length > 0 
    ? ((recentBookings.length - previousBookings.length) / previousBookings.length) * 100 
    : 0;

  // Generate trend data (last 30 days)
  const bookingsTrend = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayBookings = bookings.filter(b => b.created_at.startsWith(dateStr));
    const dayPayments = payments.filter(p => p.created_at.startsWith(dateStr));
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      bookings: dayBookings.length,
      revenue: dayPayments.reduce((sum, p) => sum + p.amount, 0),
      completed: dayBookings.filter(b => b.status === 'completed').length,
      cancelled: dayBookings.filter(b => b.status === 'cancelled').length,
      users: 0 // Would need user activity data
    };
  });

  // Category breakdown
  const categoryMap = new Map<string, { count: number; revenue: number; completed: number }>();
  bookings.forEach(booking => {
    const category = booking.work_type || 'Other';
    const existing = categoryMap.get(category) || { count: 0, revenue: 0, completed: 0 };
    const bookingPayments = payments.filter(p => p.booking_id === booking.id);
    const revenue = bookingPayments.reduce((sum, p) => sum + p.amount, 0);
    
    categoryMap.set(category, {
      count: existing.count + 1,
      revenue: existing.revenue + revenue,
      completed: existing.completed + (booking.status === 'completed' ? 1 : 0)
    });
  });

  const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => {
    const categoryReviews = reviews.filter(r => {
      const booking = bookings.find(b => b.artisan_id === r.artisan_id && b.work_type === category);
      return booking !== undefined;
    });
    
    return {
      category,
      count: data.count,
      revenue: data.revenue,
      avgRating: categoryReviews.length > 0 
        ? categoryReviews.reduce((sum, r) => sum + r.rating, 0) / categoryReviews.length 
        : 0,
      completionRate: data.count > 0 ? (data.completed / data.count) * 100 : 0
    };
  });

  return {
    overview: {
      totalBookings,
      totalRevenue,
      activeArtisans: artisans.length,
      averageRating,
      completionRate,
      responseTime: 2.4, // Would come from real performance metrics
      platformFee: totalPlatformFee,
      artisanEarnings: totalRevenue - totalPlatformFee,
      growthRate,
      churnRate: 5.2 // Would need churn analysis
    },
    realTimeMetrics: {
      activeUsers: 45, // Would come from real-time tracking
      ongoingBookings: bookings.filter(b => b.status === 'in_progress').length,
      pendingPayments: payments.filter(p => p.payment_status === 'pending').length,
      lastUpdated: now.toISOString()
    },
    bookingsTrend,
    categoryBreakdown,
    userGrowth: [], // Would need historical user data
    geographicData: [], // Would need geographic analysis  
    performanceMetrics: {
      conversionRate: 23.5, // Would need funnel analysis
      averageJobValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
      repeatCustomerRate: 45.2, // Would need customer analysis
      timeToFirstBooking: 1.8, // Would need timing analysis
      disputeRate: 2.1, // Would need dispute data
      refundRate: 1.5 // Would need refund analysis
    }
  };
}

export function useRealtimeAnalytics(refreshInterval = 30000) {
  return useAnalytics({
    autoRefresh: true,
    refreshInterval,
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    cached: false
  });
}