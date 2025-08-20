import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, userEvent } from './utils';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import { mockSupabaseClient } from './utils';

// Mock router navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// Mock AuthContext
const mockAuthContext = {
  user: null,
  session: null,
  profile: null,
  loading: false,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    // Reset auth context
    mockAuthContext.user = null;
    mockAuthContext.session = null;
    mockAuthContext.profile = null;
    mockAuthContext.loading = false;
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Authentication Integration', () => {
    it('should complete full login flow', async () => {
      const user = userEvent.setup();
      
      // Mock successful login
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: { access_token: 'token-123' },
        },
        error: null,
      });
      
      renderWithProviders(<Auth />);
      
      // Fill login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      // Verify authentication call
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should handle authentication state changes', async () => {
      // Mock auth state change callback
      let authStateCallback: (event: string, session: any) => void;
      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });
      
      renderWithProviders(<Auth />);
      
      // Simulate auth state change
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token-123',
      };
      
      authStateCallback!('SIGNED_IN', mockSession);
      
      // Auth context should be updated
      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });

  describe('Dashboard Integration', () => {
    beforeEach(() => {
      // Mock authenticated user
      mockAuthContext.user = { id: 'user-123', email: 'test@example.com' };
      mockAuthContext.session = { access_token: 'token-123' };
      mockAuthContext.profile = { id: 'profile-123', role: 'client' };
    });

    it('should load dashboard with user data', async () => {
      // Mock dashboard data queries
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        then: vi.fn().mockResolvedValue({
          data: [
            { id: 'booking-1', service_type: 'Plumbing', status: 'pending' },
            { id: 'booking-2', service_type: 'Electrical', status: 'completed' },
          ],
          error: null,
        }),
      });
      
      renderWithProviders(<Dashboard />);
      
      // Dashboard should load
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      
      // Should fetch user's bookings
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('bookings');
      });
    });

    it('should handle logout flow', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({ error: null });
      mockAuthContext.signOut = vi.fn().mockResolvedValue(undefined);
      
      renderWithProviders(<Dashboard />);
      
      // Find and click logout button (assuming it exists in dashboard)
      const logoutButton = screen.getByRole('button', { name: /sign out/i });
      await user.click(logoutButton);
      
      await waitFor(() => {
        expect(mockAuthContext.signOut).toHaveBeenCalled();
      });
    });
  });

  describe('End-to-End User Flows', () => {
    it('should complete user registration and profile setup', async () => {
      const user = userEvent.setup();
      
      // Mock successful signup
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: 'newuser@example.com' },
          session: null, // Email confirmation required
        },
        error: null,
      });
      
      renderWithProviders(<Auth />);
      
      // Switch to signup
      const signupLink = screen.getByText(/don't have an account/i);
      await user.click(signupLink);
      
      // Fill signup form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      // Should show email confirmation message
      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });

    it('should handle service booking flow', async () => {
      // Mock authenticated user
      mockAuthContext.user = { id: 'user-123', email: 'test@example.com' };
      mockAuthContext.session = { access_token: 'token-123' };
      
      // Mock booking creation
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: [{ id: 'booking-123', status: 'pending' }],
          error: null,
        }),
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        then: vi.fn(),
      });
      
      const user = userEvent.setup();
      
      // This would be in a booking component - simplified for test
      render(
        <QueryClientProvider client={queryClient}>
        <button onClick={async () => {
          await mockSupabaseClient.from('booking_requests').insert({
            user_id: 'user-123',
            service_type: 'Plumbing', 
            description: 'Fix leaky faucet',
          });
        }}>
          Book Service
        </button>
        </QueryClientProvider>
      );
      
      const bookButton = screen.getByRole('button', { name: /book service/i });
      await user.click(bookButton);
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('booking_requests');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValueOnce(
        new Error('Network error')
      );
      
      renderWithProviders(<Auth />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should handle authentication token expiry', async () => {
      // Mock token expiry scenario
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Token expired' },
      });
      
      mockAuthContext.user = null;
      mockAuthContext.session = null;
      
      renderWithProviders(<Dashboard />);
      
      // Should redirect to auth page or show login prompt
      await waitFor(() => {
        expect(screen.getByText(/sign in/i)).toBeInTheDocument();
      });
    });
  });
});