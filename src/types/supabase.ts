// Supabase table types to avoid 'any' usage
export interface BookingRecord {
  id: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  budget: number;
  work_type: string;
  city: string;
  client_email: string;
  artisan_id?: string;
  completion_date?: string;
}

export interface PaymentTransactionRecord {
  id: string;
  booking_id: string;
  amount: number;
  platform_fee: number;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
}

export interface ArtisanReviewRecord {
  id: string;
  artisan_id: string;
  rating: number;
  review?: string;
  created_at: string;
}

export interface ArtisanRecord {
  id: string;
  email: string;
  full_name: string;
  category: string;
  city: string;
  created_at: string;
  suspended: boolean;
}

export interface EscrowPaymentRecord {
  id: string;
  booking_id: string;
  status: 'pending' | 'released' | 'refunded';
  amount: number;
  created_at: string;
}

// Generic database response types
export interface DatabaseResponse<T> {
  data: T[] | null;
  error: Error | null;
  count?: number | null;
}

export interface DatabaseSingleResponse<T> {
  data: T | null;
  error: Error | null;
}

// Query filter types
export interface BookingFilters {
  status?: string;
  city?: string;
  date_range?: { start: string; end: string };
}

export interface ArtisanFilters {
  category?: string;
  city?: string;
  rating_min?: number;
  suspended?: boolean;
}

export interface PaymentFilters {
  payment_status?: string;
  date_range?: { start: string; end: string };
}