// Security utilities for the application
import { supabase } from '@/integrations/supabase/client';

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .substring(0, 1000); // Limit length
}

// XSS protection
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// SQL injection detection
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /('|(--)|;|\/\*|\*\/|xp_)/i,
    /(sp_|xp_|fn_)/i,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

// XSS detection
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[^>]*>/gi,
    /<svg[^>]*>/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

// CSRF token generation
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Secure headers utility
export function getSecureHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.paystack.co; img-src 'self' data: https:; font-src 'self' data:; frame-ancestors 'none';",
  };
}

// Secure request wrapper
export async function secureRequest<T>(
  url: string,
  options: RequestInit & { validateResponse?: boolean } = {}
): Promise<T> {
  const { validateResponse = true, ...requestOptions } = options;
  
  const headers = {
    'Content-Type': 'application/json',
    ...getSecureHeaders(),
    ...requestOptions.headers,
  };

  const response = await fetch(url, {
    ...requestOptions,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (validateResponse && typeof data === 'object') {
    // Basic response validation
    if (data.error) {
      throw new Error(data.error);
    }
  }

  return data;
}

// Password strength checker
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password should be at least 8 characters long');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain uppercase letters');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain numbers');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain special characters');
  }

  return {
    score,
    feedback,
    isStrong: score >= 4
  };
}

// Rate limiting storage (client-side)
const clientRateLimits = new Map<string, { count: number; resetTime: number }>();

export function checkClientRateLimit(
  key: string, 
  maxRequests: number, 
  windowMs: number
): boolean {
  const now = Date.now();
  const existing = clientRateLimits.get(key);

  if (!existing || now > existing.resetTime) {
    // New window or expired
    clientRateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (existing.count >= maxRequests) {
    return false;
  }

  existing.count++;
  return true;
}

// Audit logging utility
export async function logSecurityEvent(
  eventType: string,
  details: Record<string, any>,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<void> {
  try {
    await supabase.functions.invoke('security-logger', {
      body: {
        eventType,
        details,
        severity,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
    // Don't throw - logging failures shouldn't break the application
  }
}

// Validate file uploads
export function validateFileUpload(
  file: File,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp'],
  maxSize: number = 5 * 1024 * 1024 // 5MB
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum of ${maxSize / 1024 / 1024}MB`
    };
  }

  return { valid: true };
}

// Enhanced validation for booking requests
export function validateBookingRequest(data: {
  workType: string;
  description: string;
  city: string;
  budget?: number;
  urgency?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate required fields
  if (!data.workType?.trim()) {
    errors.push('Work type is required');
  }

  if (!data.description?.trim()) {
    errors.push('Description is required');
  } else if (data.description.length < 10) {
    errors.push('Description must be at least 10 characters');
  } else if (data.description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }

  if (!data.city?.trim()) {
    errors.push('City is required');
  }

  // Validate budget if provided
  if (data.budget !== undefined) {
    if (data.budget < 500) {
      errors.push('Budget must be at least ₦500');
    } else if (data.budget > 10000000) {
      errors.push('Budget cannot exceed ₦10,000,000');
    }
  }

  // Validate urgency
  const validUrgencies = ['low', 'normal', 'high', 'urgent', 'emergency'];
  if (data.urgency && !validUrgencies.includes(data.urgency)) {
    errors.push('Invalid urgency level');
  }

  // Security checks
  const combinedText = `${data.workType} ${data.description} ${data.city}`;
  if (detectXSS(combinedText)) {
    errors.push('Invalid characters detected in input');
  }

  if (detectSQLInjection(combinedText)) {
    errors.push('Invalid input detected');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Validate artisan profile data
export function validateArtisanProfile(data: {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  category: string;
  skill?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate required fields
  if (!data.fullName?.trim()) {
    errors.push('Full name is required');
  } else if (data.fullName.length < 2) {
    errors.push('Full name must be at least 2 characters');
  } else if (data.fullName.length > 100) {
    errors.push('Full name must be less than 100 characters');
  }

  if (!validators.email(data.email)) {
    errors.push('Valid email is required');
  }

  if (!validators.phone(data.phone)) {
    errors.push('Valid Nigerian phone number is required');
  }

  if (!data.city?.trim()) {
    errors.push('City is required');
  }

  if (!data.category?.trim()) {
    errors.push('Service category is required');
  }

  // Validate optional skill field
  if (data.skill && data.skill.length > 200) {
    errors.push('Skill description must be less than 200 characters');
  }

  // Security checks
  const combinedText = `${data.fullName} ${data.email} ${data.city} ${data.category} ${data.skill || ''}`;
  if (detectXSS(combinedText)) {
    errors.push('Invalid characters detected in input');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Encrypt sensitive data (client-side)
export async function encryptSensitiveData(data: string, key?: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate a random key if not provided
    const cryptoKey = key 
      ? await crypto.subtle.importKey(
          'raw',
          encoder.encode(key.padEnd(32, '0').slice(0, 32)),
          { name: 'AES-GCM' },
          false,
          ['encrypt']
        )
      : await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt']
        );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      dataBuffer
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

// Input validation helpers
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  phone: (phone: string): boolean => {
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    return phoneRegex.test(phone);
  },

  uuid: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  strongPassword: (password: string): boolean => {
    return checkPasswordStrength(password).isStrong;
  }
};