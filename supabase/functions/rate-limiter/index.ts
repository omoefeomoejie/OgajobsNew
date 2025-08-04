import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

// Rate limiting configuration
const RATE_LIMITS = {
  // Per minute limits for different endpoints
  'api': { requests: 60, window: 60 }, // 60 requests per minute for general API
  'auth': { requests: 5, window: 60 }, // 5 auth attempts per minute
  'booking': { requests: 10, window: 60 }, // 10 booking operations per minute
  'message': { requests: 30, window: 60 }, // 30 messages per minute
  'upload': { requests: 5, window: 60 }, // 5 uploads per minute
  'search': { requests: 20, window: 60 }, // 20 searches per minute
} as const;

interface RateLimitEntry {
  count: number;
  windowStart: number;
  lastRequest: number;
}

// In-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

function getRateLimitKey(ip: string, userId: string | null, endpoint: string): string {
  return `${ip}:${userId || 'anonymous'}:${endpoint}`;
}

function isRateLimited(key: string, endpoint: keyof typeof RATE_LIMITS): { limited: boolean; resetTime?: number } {
  const now = Date.now();
  const config = RATE_LIMITS[endpoint];
  const windowMs = config.window * 1000;
  
  const entry = rateLimitStore.get(key);
  
  if (!entry) {
    // First request for this key
    rateLimitStore.set(key, {
      count: 1,
      windowStart: now,
      lastRequest: now
    });
    return { limited: false };
  }
  
  // Check if we're in a new window
  if (now - entry.windowStart > windowMs) {
    // Reset window
    rateLimitStore.set(key, {
      count: 1,
      windowStart: now,
      lastRequest: now
    });
    return { limited: false };
  }
  
  // Update last request time
  entry.lastRequest = now;
  
  // Check if limit exceeded
  if (entry.count >= config.requests) {
    const resetTime = entry.windowStart + windowMs;
    return { limited: true, resetTime };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return { limited: false };
}

function getClientIp(request: Request): string {
  // Try various headers for IP detection
  const headers = request.headers;
  return (
    headers.get('cf-connecting-ip') || // Cloudflare
    headers.get('x-forwarded-for')?.split(',')[0] || // Load balancer
    headers.get('x-real-ip') || // Nginx
    headers.get('x-client-ip') || // Apache
    'unknown'
  );
}

function detectEndpointType(url: string): keyof typeof RATE_LIMITS {
  const pathname = new URL(url).pathname;
  
  if (pathname.includes('/auth')) return 'auth';
  if (pathname.includes('/booking')) return 'booking';
  if (pathname.includes('/message')) return 'message';
  if (pathname.includes('/upload')) return 'upload';
  if (pathname.includes('/search')) return 'search';
  
  return 'api'; // Default
}

// Clean up old entries periodically
function cleanupExpiredEntries() {
  const now = Date.now();
  const maxAge = 3600000; // 1 hour
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.lastRequest > maxAge) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupExpiredEntries, 600000);

serve(async (req) => {
  try {
    // Only handle POST requests for rate limit checking
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { url, userId } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const clientIp = getClientIp(req);
    const endpointType = detectEndpointType(url);
    const rateLimitKey = getRateLimitKey(clientIp, userId, endpointType);
    
    const { limited, resetTime } = isRateLimited(rateLimitKey, endpointType);
    
    if (limited) {
      const headers = {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': RATE_LIMITS[endpointType].requests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTime ? Math.ceil(resetTime / 1000).toString() : '',
        'Retry-After': resetTime ? Math.ceil((resetTime - Date.now()) / 1000).toString() : '60'
      };
      
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${Math.ceil((resetTime! - Date.now()) / 1000)} seconds.`,
          resetTime
        }),
        { status: 429, headers }
      );
    }

    // Rate limit check passed
    const currentEntry = rateLimitStore.get(rateLimitKey);
    const remaining = RATE_LIMITS[endpointType].requests - (currentEntry?.count || 0);
    
    return new Response(
      JSON.stringify({ 
        allowed: true,
        remaining,
        resetTime: currentEntry ? currentEntry.windowStart + (RATE_LIMITS[endpointType].window * 1000) : null
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': RATE_LIMITS[endpointType].requests.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
        }
      }
    );

  } catch (error) {
    console.error('Rate limiter error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});