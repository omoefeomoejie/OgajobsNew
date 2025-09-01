// Common type definitions for strict TypeScript mode

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string | null;
  message?: string;
}

export interface ValidationResponse {
  valid: boolean;
  errors: string[];
  sanitized?: unknown;
  securityViolation?: boolean;
}

export interface ErrorWithMessage {
  message: string;
  code?: string;
  statusCode?: number;
}

export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export interface FileUpload {
  file: File;
  url?: string;
  progress?: number;
  error?: string;
}

export interface FilterOptions {
  [key: string]: string | number | boolean | null | undefined;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  totalCount?: number;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryOptions {
  filters?: FilterOptions;
  pagination?: PaginationOptions;
  sort?: SortOptions;
}

// Utility types for strict typing
export type SafeAny = unknown;
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}
export interface JSONArray extends Array<JSONValue> {}

// Form data types
export interface FormData {
  [key: string]: string | number | boolean | File | null;
}

// Chat and messaging types
export interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  session_id: string;
  created_at: string;
  file_url?: string;
  file_type?: string;
  file_name?: string;
}

export interface ChatSession {
  id: string;
  status: 'active' | 'closed' | 'waiting';
  created_at: string;
  customer_info?: {
    name?: string;
    email?: string;
  };
}

export interface TypingIndicator {
  user_id: string;
  session_id: string;
  is_typing: boolean;
  updated_at: string;
}

// Analytics types
export interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
  growthRate: number;
  trendData: TrendDataPoint[];
  categoryBreakdown: CategoryData[];
  recentActivity: ActivityItem[];
}

export interface TrendDataPoint {
  date: string;
  bookings: number;
  revenue: number;
}

export interface CategoryData {
  category: string;
  count: number;
  revenue: number;
}

export interface ActivityItem {
  type: 'booking' | 'payment' | 'review';
  description: string;
  timestamp: string;
  amount?: number;
}

// Profile and user types
export interface UserProfile {
  id: string;
  email: string;
  role: 'client' | 'artisan' | 'admin' | 'agent' | 'pos_agent';
  full_name?: string;
  phone?: string;
  verification_status?: 'verified' | 'pending' | 'rejected';
  identity_verified?: boolean;
  skills_verified?: boolean;
  created_at: string;
  updated_at: string;
}

// Booking types
export interface Booking {
  id: string;
  client_id: string;
  artisan_id?: string;
  service_type: string;
  description: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date?: string;
  location: string;
  budget_range?: string;
  created_at: string;
  updated_at: string;
}