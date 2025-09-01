import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Query Keys
export const adminQueryKeys = {
  all: ['admin'] as const,
  stats: () => [...adminQueryKeys.all, 'stats'] as const,
  artisans: () => [...adminQueryKeys.all, 'artisans'] as const,
  bookings: () => [...adminQueryKeys.all, 'bookings'] as const,
  payments: () => [...adminQueryKeys.all, 'payments'] as const,
  controlStats: () => [...adminQueryKeys.all, 'control-stats'] as const,
} as const;

// Types
interface ControlStats {
  pendingVerifications: number;
  activeBookings: number;
  flaggedUsers: number;
  escrowAmount: number;
  dailyBookings: number;
  completionRate: number;
}

interface ArtisanUser {
  id: string;
  full_name: string | null;
  email: string;
  skill: string | null;
  city: string | null;
  created_at: string;
  suspended: boolean;
}

interface Booking {
  id: string;
  client_email: string;
  artisan_email: string | null;
  work_type: string;
  city: string;
  preferred_date: string | null;
  budget: number | null;
  status: string;
}

// Optimized single query for control stats
const fetchControlStats = async (): Promise<ControlStats> => {
  // Use optimized individual queries instead of N+1 patterns
  const [artisansRes, bookingsRes, paymentsRes] = await Promise.all([
    supabase.from('artisans').select('suspended', { count: 'exact' }),
    supabase.from('bookings').select('status', { count: 'exact' }),
    supabase.from('payment_transactions').select('amount, escrow_status').limit(1000)
  ]);

  const pendingArtisans = artisansRes.data?.filter(a => !a.suspended).length || 0;
  const activeBookings = bookingsRes.data?.filter(b => b.status === 'in_progress').length || 0;
  const escrowTotal = paymentsRes.data?.filter(p => p.escrow_status === 'held')
    .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return {
    pendingVerifications: pendingArtisans,
    activeBookings,
    flaggedUsers: 2, // Mock data - implement flagging system
    escrowAmount: escrowTotal,
    dailyBookings: bookingsRes.count || 0,
    completionRate: 85 // Mock data - calculate from completed vs total
  };
};

// Custom hooks with React Query
export const useControlStats = () => {
  return useQuery({
    queryKey: adminQueryKeys.controlStats(),
    queryFn: fetchControlStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 30 * 1000, // 30 seconds for real-time updates
    retry: 2,
  });
};

export const useArtisans = () => {
  return useQuery({
    queryKey: adminQueryKeys.artisans(),
    queryFn: async (): Promise<ArtisanUser[]> => {
      const { data, error } = await supabase
        .from('artisans')
        .select('id, full_name, email, skill, city, created_at, suspended')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useBookings = () => {
  return useQuery({
    queryKey: adminQueryKeys.bookings(),
    queryFn: async (): Promise<Booking[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, client_email, artisan_email, work_type, city, preferred_date, budget, status')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
    retry: 2,
  });
};

// Mutations with optimistic updates
export const useUpdateArtisan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'approve' | 'reject' }) => {
      const { error } = await supabase
        .from('artisans')
        .update({ suspended: action === 'reject' })
        .eq('id', userId);

      if (error) throw error;
      return { userId, action };
    },
    onMutate: async ({ userId, action }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.artisans() });

      // Snapshot previous value
      const previousArtisans = queryClient.getQueryData<ArtisanUser[]>(adminQueryKeys.artisans());

      // Optimistically update
      if (previousArtisans) {
        queryClient.setQueryData<ArtisanUser[]>(
          adminQueryKeys.artisans(),
          previousArtisans.map(artisan =>
            artisan.id === userId
              ? { ...artisan, suspended: action === 'reject' }
              : artisan
          )
        );
      }

      return { previousArtisans };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousArtisans) {
        queryClient.setQueryData(adminQueryKeys.artisans(), context.previousArtisans);
      }
      toast({
        title: "Error",
        description: `Failed to ${variables.action} user. Please try again.`,
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      toast({
        title: `User ${data.action}d successfully`,
        description: `The artisan has been ${data.action}d.`,
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.artisans() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.controlStats() });
    },
  });
};

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      bookingId, 
      action 
    }: { 
      bookingId: string; 
      action: 'approve' | 'cancel' | 'complete' 
    }) => {
      let updateData: Partial<Booking> & { completion_date?: string } = {};
      
      switch (action) {
        case 'approve':
          updateData = { status: 'approved' };
          break;
        case 'cancel':
          updateData = { status: 'cancelled' };
          break;
        case 'complete':
          updateData = { status: 'completed', completion_date: new Date().toISOString() };
          break;
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;
      return { bookingId, action, updateData };
    },
    onMutate: async ({ bookingId, action }) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.bookings() });

      const previousBookings = queryClient.getQueryData<Booking[]>(adminQueryKeys.bookings());

      if (previousBookings) {
        queryClient.setQueryData<Booking[]>(
          adminQueryKeys.bookings(),
          previousBookings.map(booking =>
            booking.id === bookingId
              ? { ...booking, status: action === 'approve' ? 'approved' : action === 'cancel' ? 'cancelled' : 'completed' }
              : booking
          )
        );
      }

      return { previousBookings };
    },
    onError: (err, variables, context) => {
      if (context?.previousBookings) {
        queryClient.setQueryData(adminQueryKeys.bookings(), context.previousBookings);
      }
      toast({
        title: "Error",
        description: `Failed to ${variables.action} booking. Please try again.`,
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      toast({
        title: `Booking ${data.action}d successfully`,
        description: `The booking has been ${data.action}d.`,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.bookings() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.controlStats() });
    },
  });
};