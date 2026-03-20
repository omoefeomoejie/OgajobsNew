import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidationRules {
  required?: string[];
  email?: string[];
  phone?: string[];
  minLength?: { [key: string]: number };
  maxLength?: { [key: string]: number };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data, rules }: { data: any, rules: ValidationRules } = await req.json();
    
    const errors: string[] = [];

    // Check required fields
    if (rules.required) {
      for (const field of rules.required) {
        if (!data[field] || data[field].toString().trim() === '') {
          errors.push(`${field} is required`);
        }
      }
    }

    // Validate email format
    if (rules.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const field of rules.email) {
        if (data[field] && !emailRegex.test(data[field])) {
          errors.push(`${field} must be a valid email address`);
        }
      }
    }

    // Validate phone format
    if (rules.phone) {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      for (const field of rules.phone) {
        if (data[field] && !phoneRegex.test(data[field])) {
          errors.push(`${field} must be a valid phone number`);
        }
      }
    }

    // Check minimum length
    if (rules.minLength) {
      for (const [field, minLen] of Object.entries(rules.minLength)) {
        if (data[field] && data[field].toString().length < minLen) {
          errors.push(`${field} must be at least ${minLen} characters long`);
        }
      }
    }

    // Check maximum length
    if (rules.maxLength) {
      for (const [field, maxLen] of Object.entries(rules.maxLength)) {
        if (data[field] && data[field].toString().length > maxLen) {
          errors.push(`${field} must be no more than ${maxLen} characters long`);
        }
      }
    }

    const isValid = errors.length === 0;

    return new Response(
      JSON.stringify({
        valid: isValid,
        errors: errors,
        sanitized_data: data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Request validator error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})