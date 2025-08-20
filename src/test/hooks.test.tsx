import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useSecureSubmit } from '@/hooks/useSecureSubmit';
import { mockSupabaseClient } from './utils';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Custom Hooks Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('usePerformanceMonitor', () => {
    it('should initialize with default metrics', () => {
      const { result } = renderHook(() => usePerformanceMonitor(), {
        wrapper: createWrapper(),
      });
      
      expect(result.current.metrics).toBeDefined();
      expect(result.current.performanceScore).toBeDefined();
      expect(result.current.getPerformanceReport).toBeDefined();
      expect(result.current.measureWebVitals).toBeDefined();
    });

    it('should measure web vitals correctly', () => {
      const { result } = renderHook(() => usePerformanceMonitor(), {
        wrapper: createWrapper(),
      });
      
      // Call measureWebVitals to trigger measurement
      result.current.measureWebVitals();
      
      expect(result.current.metrics).toBeDefined();
    });

    it('should generate performance report', () => {
      const { result } = renderHook(() => usePerformanceMonitor(), {
        wrapper: createWrapper(),
      });
      
      const report = result.current.getPerformanceReport();
      
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('score');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('grade');
    });
  });

  describe('useSecureSubmit', () => {
    it('should handle secure form submission', async () => {
      const submitFn = vi.fn().mockResolvedValue({ success: true });
      
      const { result } = renderHook(() => useSecureSubmit({ rateLimitKey: 'test-key' }), {
        wrapper: createWrapper(),
      });
      
      const formData = { email: 'test@example.com', message: 'Hello' };
      await result.current.submitSecurely(formData, submitFn);
      
      expect(submitFn).toHaveBeenCalledWith(formData);
    });

    it('should manage loading state correctly', async () => {
      let resolveSubmit: (value: any) => void;
      const submitFn = vi.fn().mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useSecureSubmit({ rateLimitKey: 'test-key' }), {
        wrapper: createWrapper(),
      });
      
      expect(result.current.isSubmitting).toBe(false);
      
      const submitPromise = result.current.submitSecurely({ email: 'test@example.com' }, submitFn);
      
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });
      
      resolveSubmit!({ success: true });
      await submitPromise;
      
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it('should track submission attempts', () => {
      const { result } = renderHook(() => useSecureSubmit({ rateLimitKey: 'test-key' }), {
        wrapper: createWrapper(),
      });
      
      expect(result.current.attempts).toBe(0);
      expect(result.current.isBlocked).toBe(false);
    });
  });
});