// Core types for OgaJobs platform
export interface User {
  id: string;
  email: string;
  role: 'client' | 'artisan' | 'pos_agent' | 'admin';
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  city: string;
  nin?: string;
  bvn?: string;
  votersCard?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  profilePhotoUrl?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  subcategories: ServiceSubcategory[];
  priority: number;
}

export interface ServiceSubcategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  basePrice?: number;
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface Artisan {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  skills: string[];
  categories: string[];
  experience: string;
  availability: ArtisanAvailability[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  trustScore: number;
  completedJobs: number;
  averageRating: number;
  profilePhotoUrl?: string;
  portfolioImages?: string[];
  certifications?: Certification[];
  pricing: ServicePricing[];
  isActive: boolean;
  referredBy?: string; // POS agent ID
}

export interface ArtisanAvailability {
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  documentUrl?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

export interface ServicePricing {
  categoryId: string;
  subcategoryId: string;
  price: number;
  unit: 'per_hour' | 'per_job' | 'per_sqm' | 'per_day';
  description?: string;
}

export interface Client {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  address?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  trustScore: number;
  completedBookings: number;
  averageRating: number;
}

export interface Booking {
  id: string;
  clientId: string;
  artisanId?: string;
  categoryId: string;
  subcategoryId: string;
  title: string;
  description: string;
  location: string;
  city: string;
  preferredDate: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  budgetRange: {
    min: number;
    max: number;
  };
  status: 'open' | 'quoted' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  quotes: Quote[];
  agreedPrice?: number;
  paymentStatus: 'pending' | 'held' | 'paid' | 'refunded';
  completionImages?: string[];
  clientRating?: number;
  artisanRating?: number;
  clientReview?: string;
  artisanReview?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  bookingId: string;
  artisanId: string;
  price: number;
  message: string;
  estimatedDuration: string;
  proposedStartDate: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  verifiedCompletion: boolean;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  amount: number;
  platformFee: number;
  artisanEarnings: number;
  status: 'pending' | 'held' | 'released' | 'refunded';
  paymentMethod: 'mobile_money' | 'bank_transfer' | 'card';
  paymentProvider: 'paystack' | 'flutterwave';
  transactionReference: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  messageType: 'text' | 'image' | 'document' | 'system';
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  bookingId?: string;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface PosAgent {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  businessAddress: string;
  city: string;
  commissionRate: number;
  totalReferrals: number;
  totalEarnings: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isActive: boolean;
}

export interface DisputeCase {
  id: string;
  bookingId: string;
  initiatorId: string;
  respondentId: string;
  reason: string;
  description: string;
  evidence: string[];
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  resolution?: string;
  refundAmount?: number;
  resolvedBy?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  category: 'payment' | 'booking' | 'verification' | 'dispute' | 'technical' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  isStaff: boolean;
  attachments?: string[];
  createdAt: string;
}

export interface TrustMetrics {
  completionRate: number;
  responseTime: number; // in minutes
  repeatClientRate: number;
  disputeRate: number;
  verificationLevel: 'basic' | 'standard' | 'premium';
}