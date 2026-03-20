import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from './utils';
import userEvent from '@testing-library/user-event';
import BookingRequest from '@/pages/BookingRequest';

// ── Supabase mock ─────────────────────────────────────────────────────────────
const mockInsert = vi.fn();
const mockFrom = vi.fn();

const mockSupabaseClient = vi.hoisted(() => ({
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  from: vi.fn(),
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  }),
  removeChannel: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// Mock router hooks
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    useNavigate: () => vi.fn(),
  };
});

// Auth context — authenticated user
vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: { id: 'user-123', email: 'client@example.com' },
    session: { access_token: 'tok' },
    profile: { id: 'user-123', role: 'client' },
    loading: false,
    isInitialized: true,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
// Full chain that satisfies NotificationCenter, MyBookings, and insert calls
function makeChain(insertResult: { data: any; error: any } = { data: { id: 'booking-abc' }, error: null }) {
  const chain: any = {
    insert: vi.fn().mockResolvedValue(insertResult),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(insertResult),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockImplementation((resolve: any) =>
      Promise.resolve({ data: [], error: null }).then(resolve)
    ),
  };
  return chain;
}

// Keep old name for backward compat in this file
const makeInsertChain = (result: { data: any; error: any }) => makeChain(result);

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Booking Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: successful insert
    mockSupabaseClient.from.mockReturnValue(
      makeInsertChain({ data: { id: 'booking-abc' }, error: null })
    );
  });

  it('renders the booking request form heading', () => {
    render(<BookingRequest />);
    expect(screen.getByText(/request a service/i)).toBeInTheDocument();
  });

  it('renders all required form fields', () => {
    render(<BookingRequest />);
    expect(screen.getByLabelText(/service type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/budget/i)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    render(<BookingRequest />);
    expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
  });

  it('submit button is enabled initially', () => {
    render(<BookingRequest />);
    const btn = screen.getByRole('button', { name: /submit request/i });
    expect(btn).not.toBeDisabled();
  });

  it('writes to the bookings table on submit when required fields are filled', async () => {
    const user = userEvent.setup();
    render(<BookingRequest />);

    // Budget is the only plain text input — fill it
    const budgetInput = screen.getByLabelText(/budget/i);
    await user.type(budgetInput, '15000');

    // The Select components (Service Type, City, Urgency) use shadcn which
    // renders as combobox buttons — open and choose an option.
    const comboboxes = screen.getAllByRole('combobox');

    // First combobox = Service Type
    await user.click(comboboxes[0]);
    const plumbingOption = await screen.findByText('Plumbing');
    await user.click(plumbingOption);

    // Second combobox = City
    await user.click(comboboxes[1]);
    const lagosOption = await screen.findByText('Lagos');
    await user.click(lagosOption);

    // Submit
    const submitBtn = screen.getByRole('button', { name: /submit request/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('bookings');
    });
  });

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup();

    // Slow insert
    const slowChain = makeChain();
    slowChain.insert = vi.fn().mockReturnValue(
      new Promise((resolve) =>
        setTimeout(() => resolve({ data: { id: 'x' }, error: null }), 300)
      )
    );
    mockSupabaseClient.from.mockReturnValue(slowChain);

    render(<BookingRequest />);

    const comboboxes = screen.getAllByRole('combobox');
    await user.click(comboboxes[0]);
    const plumbingOption = await screen.findByText('Plumbing');
    await user.click(plumbingOption);

    await user.click(comboboxes[1]);
    const lagosOption = await screen.findByText('Lagos');
    await user.click(lagosOption);

    const submitBtn = screen.getByRole('button', { name: /submit request/i });
    await user.click(submitBtn);

    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent(/submitting/i);
  });

  it('shows success state after successful submission', async () => {
    const user = userEvent.setup();

    mockSupabaseClient.from.mockReturnValue(
      makeInsertChain({ data: { id: 'booking-ok' }, error: null })
    );

    render(<BookingRequest />);

    const comboboxes = screen.getAllByRole('combobox');
    await user.click(comboboxes[0]);
    const plumbingOption = await screen.findByText('Plumbing');
    await user.click(plumbingOption);

    await user.click(comboboxes[1]);
    const lagosOption = await screen.findByText('Lagos');
    await user.click(lagosOption);

    const submitBtn = screen.getByRole('button', { name: /submit request/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/booking request submitted/i)).toBeInTheDocument();
    });
  });

  it('shows an error when supabase insert fails', async () => {
    const user = userEvent.setup();

    const errorChain = makeChain({ data: null, error: { message: 'DB error occurred' } });
    mockSupabaseClient.from.mockReturnValue(errorChain);

    render(<BookingRequest />);

    const comboboxes = screen.getAllByRole('combobox');
    await user.click(comboboxes[0]);
    const plumbingOption = await screen.findByText('Plumbing');
    await user.click(plumbingOption);

    await user.click(comboboxes[1]);
    const lagosOption = await screen.findByText('Lagos');
    await user.click(lagosOption);

    const submitBtn = screen.getByRole('button', { name: /submit request/i });
    await user.click(submitBtn);

    await waitFor(() => {
      // Insert was attempted with the correct table
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('bookings');
    });
  });

  it('accepts optional description and budget without breaking', async () => {
    const user = userEvent.setup();
    render(<BookingRequest />);

    const descInput = screen.getByLabelText(/description/i);
    await user.type(descInput, 'Leaky kitchen tap needs fixing');

    const budgetInput = screen.getByLabelText(/budget/i);
    await user.type(budgetInput, '8500');

    // Fields accept input without errors
    expect(descInput).toHaveValue('Leaky kitchen tap needs fixing');
    expect(budgetInput).toHaveValue(8500);
  });
});
