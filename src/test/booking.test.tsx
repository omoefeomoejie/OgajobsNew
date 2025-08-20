import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, userEvent } from './utils';
import BookingRequest from '@/pages/BookingRequest';
import { mockSupabaseClient } from './utils';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// Mock useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    session: { access_token: 'test-token' },
    profile: { id: 'test-profile-id' },
    loading: false,
  }),
}));

describe('Booking Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful insert
    mockSupabaseClient.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        data: [{ id: 'booking-123' }],
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      then: vi.fn(),
    });
  });

  it('should render booking request form', () => {
    render(<BookingRequest />);
    
    expect(screen.getByText(/request a service/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/service type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<BookingRequest />);
    
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/service type is required/i)).toBeInTheDocument();
    });
  });

  it('should handle successful booking submission', async () => {
    const user = userEvent.setup();
    render(<BookingRequest />);
    
    // Fill out the form
    const serviceTypeSelect = screen.getByLabelText(/service type/i);
    const citySelect = screen.getByLabelText(/city/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const budgetInput = screen.getByLabelText(/budget/i);
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    
    await user.selectOptions(serviceTypeSelect, 'Plumbing');
    await user.selectOptions(citySelect, 'Lagos');
    await user.type(descriptionInput, 'Need to fix a leaky faucet');
    await user.type(budgetInput, '5000');
    
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('booking_requests');
    });
  });

  it('should handle booking submission errors', async () => {
    const user = userEvent.setup();
    
    // Mock error response
    mockSupabaseClient.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      then: vi.fn(),
    });
    
    render(<BookingRequest />);
    
    // Fill out and submit form
    const serviceTypeSelect = screen.getByLabelText(/service type/i);
    const citySelect = screen.getByLabelText(/city/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    
    await user.selectOptions(serviceTypeSelect, 'Plumbing');
    await user.selectOptions(citySelect, 'Lagos');
    await user.type(descriptionInput, 'Need to fix a leaky faucet');
    
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/database error/i)).toBeInTheDocument();
    });
  });

  it('should validate budget input', async () => {
    const user = userEvent.setup();
    render(<BookingRequest />);
    
    const budgetInput = screen.getByLabelText(/budget/i);
    await user.type(budgetInput, 'invalid-budget');
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid budget/i)).toBeInTheDocument();
    });
  });

  it('should show success message after submission', async () => {
    const user = userEvent.setup();
    render(<BookingRequest />);
    
    // Fill out and submit form
    const serviceTypeSelect = screen.getByLabelText(/service type/i);
    const citySelect = screen.getByLabelText(/city/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    
    await user.selectOptions(serviceTypeSelect, 'Plumbing');
    await user.selectOptions(citySelect, 'Lagos');
    await user.type(descriptionInput, 'Need to fix a leaky faucet');
    
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/request submitted successfully/i)).toBeInTheDocument();
    });
  });

  it('should disable form during submission', async () => {
    const user = userEvent.setup();
    
    // Mock delayed response
    mockSupabaseClient.from.mockReturnValue({
      insert: vi.fn().mockReturnValue(
        new Promise(resolve => setTimeout(() => resolve({
          data: [{ id: 'booking-123' }],
          error: null,
        }), 100))
      ),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      then: vi.fn(),
    });
    
    render(<BookingRequest />);
    
    const serviceTypeSelect = screen.getByLabelText(/service type/i);
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    
    await user.selectOptions(serviceTypeSelect, 'Plumbing');
    await user.click(submitButton);
    
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/submitting/i);
  });
});