import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useSecureSubmit } from '@/hooks/useSecureSubmit';

const mockSupabaseClient = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: { allowed: true, remaining: 59 }, error: null }),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    session: { access_token: 'tok' },
    profile: null,
    loading: false,
    isInitialized: true,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
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

      result.current.measureWebVitals();

      expect(result.current.metrics).toBeDefined();
    });

    it('should generate performance report', () => {
      const { result } = renderHook(() => usePerformanceMonitor(), {
        wrapper: createWrapper(),
      });

      const report = result.current.getPerformanceReport();

      // getPerformanceReport returns { score, grade, recommendations, isOptimal, renderCount, componentName }
      expect(report).toHaveProperty('score');
      expect(report).toHaveProperty('grade');
      expect(report).toHaveProperty('recommendations');
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
      const submitFn = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => useSecureSubmit({ rateLimitKey: 'test-key' }), {
        wrapper: createWrapper(),
      });

      expect(result.current.isSubmitting).toBe(false);

      const submitPromise = result.current.submitSecurely({ email: 'test@example.com' }, submitFn);

      await waitFor(() => {
        // After submission completes, isSubmitting should be false
        expect(result.current.isSubmitting).toBe(false);
      });

      await submitPromise;
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
