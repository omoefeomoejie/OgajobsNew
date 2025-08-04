import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

// Validation schemas for different request types
const VALIDATION_SCHEMAS = {
  booking: {
    required: ['client_email', 'work_type', 'city', 'description'],
    optional: ['budget', 'preferred_date', 'urgency'],
    types: {
      client_email: 'email',
      work_type: 'string',
      city: 'string',
      description: 'string',
      budget: 'number',
      preferred_date: 'date',
      urgency: 'string'
    },
    constraints: {
      work_type: ['Electrical', 'Plumbing', 'Carpentry', 'Painting', 'Cleaning', 'Other'],
      urgency: ['low', 'normal', 'high', 'urgent'],
      budget: { min: 1000, max: 10000000 }, // ₦1,000 to ₦10,000,000
      description: { minLength: 10, maxLength: 1000 }
    }
  },
  
  artisan: {
    required: ['full_name', 'email', 'phone', 'category', 'city'],
    optional: ['skill', 'message', 'photo_url'],
    types: {
      full_name: 'string',
      email: 'email',
      phone: 'phone',
      category: 'string',
      city: 'string',
      skill: 'string',
      message: 'string',
      photo_url: 'url'
    },
    constraints: {
      category: ['Electrical', 'Plumbing', 'Carpentry', 'Painting', 'Cleaning', 'Other'],
      full_name: { minLength: 2, maxLength: 100 },
      phone: { pattern: /^(\+234|0)[789][01]\d{8}$/ } // Nigerian phone format
    }
  },
  
  message: {
    required: ['message', 'receiver_email'],
    optional: ['conversation_id'],
    types: {
      message: 'string',
      receiver_email: 'email',
      conversation_id: 'uuid'
    },
    constraints: {
      message: { minLength: 1, maxLength: 1000 }
    }
  },
  
  review: {
    required: ['rating', 'artisan_id'],
    optional: ['review'],
    types: {
      rating: 'number',
      artisan_id: 'uuid',
      review: 'string'
    },
    constraints: {
      rating: { min: 1, max: 5 },
      review: { maxLength: 500 }
    }
  },

  profile: {
    required: [],
    optional: ['full_name', 'phone', 'avatar_url', 'bio'],
    types: {
      full_name: 'string',
      phone: 'phone',
      avatar_url: 'url',
      bio: 'string'
    },
    constraints: {
      full_name: { minLength: 2, maxLength: 100 },
      bio: { maxLength: 500 },
      phone: { pattern: /^(\+234|0)[789][01]\d{8}$/ }
    }
  }
};

// Input sanitization functions
function sanitizeString(value: string): string {
  return value
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .substring(0, 1000); // Limit length
}

function sanitizeEmail(value: string): string {
  return value.toLowerCase().trim();
}

function sanitizePhone(value: string): string {
  return value.replace(/[^\d+]/g, ''); // Only digits and +
}

// Validation functions
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
  return phoneRegex.test(phone);
}

function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateDate(date: string): boolean {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

function validateType(value: any, type: string): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'email':
      return typeof value === 'string' && validateEmail(value);
    case 'phone':
      return typeof value === 'string' && validatePhone(value);
    case 'uuid':
      return typeof value === 'string' && validateUUID(value);
    case 'url':
      return typeof value === 'string' && validateURL(value);
    case 'date':
      return typeof value === 'string' && validateDate(value);
    case 'boolean':
      return typeof value === 'boolean';
    default:
      return false;
  }
}

function validateConstraints(value: any, constraints: any, fieldName: string): string[] {
  const errors: string[] = [];

  if (typeof constraints === 'object') {
    if (constraints.min !== undefined && value < constraints.min) {
      errors.push(`${fieldName} must be at least ${constraints.min}`);
    }
    
    if (constraints.max !== undefined && value > constraints.max) {
      errors.push(`${fieldName} must be at most ${constraints.max}`);
    }
    
    if (constraints.minLength !== undefined && value.length < constraints.minLength) {
      errors.push(`${fieldName} must be at least ${constraints.minLength} characters`);
    }
    
    if (constraints.maxLength !== undefined && value.length > constraints.maxLength) {
      errors.push(`${fieldName} must be at most ${constraints.maxLength} characters`);
    }
    
    if (constraints.pattern && !constraints.pattern.test(value)) {
      errors.push(`${fieldName} format is invalid`);
    }
  } else if (Array.isArray(constraints)) {
    if (!constraints.includes(value)) {
      errors.push(`${fieldName} must be one of: ${constraints.join(', ')}`);
    }
  }

  return errors;
}

function sanitizeData(data: any, schema: any): any {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;

    const type = schema.types[key];
    
    switch (type) {
      case 'string':
        sanitized[key] = sanitizeString(value as string);
        break;
      case 'email':
        sanitized[key] = sanitizeEmail(value as string);
        break;
      case 'phone':
        sanitized[key] = sanitizePhone(value as string);
        break;
      default:
        sanitized[key] = value;
    }
  }

  return sanitized;
}

function validateRequest(data: any, schemaType: keyof typeof VALIDATION_SCHEMAS): { valid: boolean; errors: string[]; sanitized?: any } {
  const schema = VALIDATION_SCHEMAS[schemaType];
  const errors: string[] = [];

  // Check required fields
  for (const field of schema.required) {
    if (!(field in data) || data[field] === null || data[field] === undefined || data[field] === '') {
      errors.push(`${field} is required`);
    }
  }

  // Validate field types and constraints
  for (const [field, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === '') continue;

    // Check if field is allowed
    if (!schema.required.includes(field) && !schema.optional.includes(field)) {
      errors.push(`${field} is not allowed`);
      continue;
    }

    const expectedType = schema.types[field];
    if (!validateType(value, expectedType)) {
      errors.push(`${field} must be a valid ${expectedType}`);
      continue;
    }

    // Check constraints
    const constraints = schema.constraints?.[field];
    if (constraints) {
      errors.push(...validateConstraints(value, constraints, field));
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Sanitize data
  const sanitized = sanitizeData(data, schema);

  return { valid: true, errors: [], sanitized };
}

// Security checks
function detectSQLInjection(value: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /('|(--)|;|\/\*|\*\/|xp_)/i,
    /(sp_|xp_|fn_)/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(value));
}

function detectXSS(value: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(value));
}

function performSecurityChecks(data: any): string[] {
  const securityErrors: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      if (detectSQLInjection(value)) {
        securityErrors.push(`Potential SQL injection detected in ${key}`);
      }
      
      if (detectXSS(value)) {
        securityErrors.push(`Potential XSS attempt detected in ${key}`);
      }
    }
  }

  return securityErrors;
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, schemaType } = await req.json();

    if (!data || !schemaType) {
      return new Response(
        JSON.stringify({ error: 'Data and schemaType are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!(schemaType in VALIDATION_SCHEMAS)) {
      return new Response(
        JSON.stringify({ error: 'Invalid schema type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Perform security checks
    const securityErrors = performSecurityChecks(data);
    if (securityErrors.length > 0) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          errors: securityErrors,
          securityViolation: true 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate request
    const validation = validateRequest(data, schemaType);

    return new Response(
      JSON.stringify(validation),
      { 
        status: validation.valid ? 200 : 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Request validation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});