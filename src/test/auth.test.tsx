import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, userEvent } from './utils';
import Auth from '@/pages/Auth';
import { mockSupabaseClient } from './utils';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('Authentication Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form by default', () => {
    render(<Auth />);
    
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should switch to signup form when clicking signup link', async () => {
    const user = userEvent.setup();
    render(<Auth />);
    
    const signupLink = screen.getByText(/don't have an account/i);
    await user.click(signupLink);
    
    await waitFor(() => {
      expect(screen.getByText(/create account/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<Auth />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  it('should validate password requirements', async () => {
    const user = userEvent.setup();
    render(<Auth />);
    
    // Switch to signup
    const signupLink = screen.getByText(/don't have an account/i);
    await user.click(signupLink);
    
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await user.type(passwordInput, '123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('should handle successful login', async () => {
    const user = userEvent.setup();
    
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        user: { id: '1', email: 'test@example.com' },
        session: { access_token: 'token' },
      },
      error: null,
    });
    
    render(<Auth />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should handle login errors', async () => {
    const user = userEvent.setup();
    
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    });
    
    render(<Auth />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should handle successful signup', async () => {
    const user = userEvent.setup();
    
    mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
      data: {
        user: { id: '1', email: 'newuser@example.com' },
        session: null,
      },
      error: null,
    });
    
    render(<Auth />);
    
    // Switch to signup
    const signupLink = screen.getByText(/don't have an account/i);
    await user.click(signupLink);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: expect.stringContaining('http://localhost:3000'),
        },
      });
    });
  });

  it('should handle signup errors', async () => {
    const user = userEvent.setup();
    
    mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    });
    
    render(<Auth />);
    
    // Switch to signup
    const signupLink = screen.getByText(/don't have an account/i);
    await user.click(signupLink);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/user already registered/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed response
    mockSupabaseClient.auth.signInWithPassword.mockReturnValueOnce(
      new Promise(resolve => setTimeout(() => resolve({
        data: { user: null, session: null },
        error: null,
      }), 100))
    );
    
    render(<Auth />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/signing in/i);
  });
});