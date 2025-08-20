import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Simple hook to avoid deep type instantiation errors
export function usePaginatedAnalytics(
  tableName: 'bookings' | 'artisans' | 'payment_transactions',
  pageSize = 50,
  filters?: Record<string, string | number | boolean>
) {
  return useQuery({
    queryKey: [tableName, 'paginated', filters, pageSize],
    queryFn: async () => {
      // Build query without complex type chains
      const { data, count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .range(0, pageSize - 1)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return {
        data: data || [],
        totalCount: count || 0,
        hasMore: (count || 0) > pageSize,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
  });
}