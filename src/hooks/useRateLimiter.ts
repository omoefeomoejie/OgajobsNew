import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RateLimitResponse {
  allowed: boolean;
  remaining?: number;
  resetTime?: number;
  error?: string;
  message?: string;
}

interface RateLimitState {
  isLimited: boolean;
  remaining: number;
  resetTime: number | null;
  loading: boolean;
}

export function useRateLimiter() {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isLimited: false,
    remaining: 60,
    resetTime: null,
    loading: false
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  const checkRateLimit = useCallback(async (url: string): Promise<boolean> => {
    setRateLimitState(prev => ({ ...prev, loading: true }));

    try {
      const { data, error } = await supabase.functions.invoke('rate-limiter', {
        body: {
          url,
          userId: user?.id || null
        }
      });

      if (error) {
        console.error('Rate limiter error:', error);
        // Allow request if rate limiter fails (fail open)
        setRateLimitState(prev => ({ ...prev, loading: false }));
        return true;
      }

      const response: RateLimitResponse = data;

      if (!response.allowed) {
        const resetTimeSeconds = response.resetTime ? Math.ceil((response.resetTime - Date.now()) / 1000) : 60;
        
        setRateLimitState({
          isLimited: true,
          remaining: 0,
          resetTime: response.resetTime || null,
          loading: false
        });

        toast({
          title: "Rate Limit Exceeded",
          description: response.message || `Too many requests. Please wait ${resetTimeSeconds} seconds.`,
          variant: "destructive",
          duration: 5000,
        });

        return false;
      }

      setRateLimitState({
        isLimited: false,
        remaining: response.remaining || 60,
        resetTime: response.resetTime || null,
        loading: false
      });

      return true;

    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Allow request if rate limiter fails (fail open)
      setRateLimitState(prev => ({ ...prev, loading: false }));
      return true;
    }
  }, [user?.id, toast]);

  const withRateLimit = useCallback(async <T>(
    url: string,
    operation: () => Promise<T>
  ): Promise<T | null> => {
    const canProceed = await checkRateLimit(url);
    
    if (!canProceed) {
      return null;
    }

    return await operation();
  }, [checkRateLimit]);

  const getRemainingRequests = useCallback(() => {
    return rateLimitState.remaining;
  }, [rateLimitState.remaining]);

  const getResetTime = useCallback(() => {
    return rateLimitState.resetTime;
  }, [rateLimitState.resetTime]);

  const isRateLimited = useCallback(() => {
    return rateLimitState.isLimited;
  }, [rateLimitState.isLimited]);

  return {
    checkRateLimit,
    withRateLimit,
    getRemainingRequests,
    getResetTime,
    isRateLimited,
    loading: rateLimitState.loading,
    rateLimitState
  };
}