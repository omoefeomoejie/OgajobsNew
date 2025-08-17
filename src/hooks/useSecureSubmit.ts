import { useState } from 'react';
import { useRateLimiter } from './useRateLimiter';
import { sanitizeInput, detectXSS, detectSQLInjection, logSecurityEvent } from '@/lib/security';
import { useToast } from './use-toast';

interface UseSecureSubmitOptions {
  rateLimitKey: string;
  maxAttempts?: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  validator?: (data: any) => { valid: boolean; errors: string[] };
}

export function useSecureSubmit(options: UseSecureSubmitOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { withRateLimit } = useRateLimiter();
  const { toast } = useToast();

  const {
    rateLimitKey,
    maxAttempts = 5,
    onSuccess,
    onError,
    validator
  } = options;

  const submitSecurely = async (
    data: any,
    submitFn: (sanitizedData: any) => Promise<void>
  ) => {
    // Check if max attempts exceeded
    if (attempts >= maxAttempts) {
      const error = 'Maximum submission attempts exceeded. Please try again later.';
      
      await logSecurityEvent('max_attempts_exceeded', {
        rateLimitKey,
        attempts,
        timestamp: new Date().toISOString()
      }, 'high');
      
      if (onError) onError(error);
      return;
    }

    setIsSubmitting(true);
    setAttempts(prev => prev + 1);

    try {
      // Sanitize all string inputs
      const sanitizedData = Object.keys(data).reduce((acc, key) => {
        const value = data[key];
        if (typeof value === 'string') {
          acc[key] = sanitizeInput(value);
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      // Security validation
      const combinedText = Object.values(sanitizedData)
        .filter(v => typeof v === 'string')
        .join(' ');

      if (detectXSS(combinedText)) {
        await logSecurityEvent('xss_attempt', {
          rateLimitKey,
          detectedInput: combinedText.substring(0, 100),
          timestamp: new Date().toISOString()
        }, 'critical');
        
        throw new Error('Invalid characters detected in input');
      }

      if (detectSQLInjection(combinedText)) {
        await logSecurityEvent('sql_injection_attempt', {
          rateLimitKey,
          detectedInput: combinedText.substring(0, 100),
          timestamp: new Date().toISOString()
        }, 'critical');
        
        throw new Error('Invalid input detected');
      }

      // Custom validation
      if (validator) {
        const validation = validator(sanitizedData);
        if (!validation.valid) {
          throw new Error(validation.errors.join('. '));
        }
      }

      // Submit with rate limiting
      await withRateLimit(rateLimitKey, async () => {
        await submitFn(sanitizedData);
      });

      // Reset attempts on success
      setAttempts(0);
      
      if (onSuccess) onSuccess();
      
      toast({
        title: "Success",
        description: "Form submitted successfully",
      });

    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred while submitting';
      
      await logSecurityEvent('form_submission_error', {
        rateLimitKey,
        error: errorMessage,
        attempts,
        timestamp: new Date().toISOString()
      }, 'medium');
      
      if (onError) onError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitSecurely,
    isSubmitting,
    attempts,
    isBlocked: attempts >= maxAttempts
  };
}