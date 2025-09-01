import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ValidationResponse } from '@/types/common';

interface ValidationState {
  isValidating: boolean;
  lastValidation: ValidationResponse | null;
}

export type SchemaType = 'booking' | 'artisan' | 'message' | 'review' | 'profile';

export function useRequestValidator() {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    lastValidation: null
  });
  
  const { toast } = useToast();

  const validateRequest = useCallback(async (
    data: unknown, 
    schemaType: SchemaType
  ): Promise<ValidationResponse> => {
    setValidationState(prev => ({ ...prev, isValidating: true }));

    try {
      const { data: response, error } = await supabase.functions.invoke('request-validator', {
        body: {
          data,
          schemaType
        }
      });

      if (error) {
        console.error('Request validation error:', error);
        // Fail open - allow request if validator fails
        const fallbackResponse: ValidationResponse = {
          valid: true,
          errors: [],
          sanitized: data
        };
        setValidationState({
          isValidating: false,
          lastValidation: fallbackResponse
        });
        return fallbackResponse;
      }

      const validation: ValidationResponse = response;

      if (validation.securityViolation) {
        toast({
          title: "Security Violation Detected",
          description: "Your request contains potentially malicious content.",
          variant: "destructive",
          duration: 5000,
        });
      } else if (!validation.valid && validation.errors.length > 0) {
        toast({
          title: "Validation Error",
          description: validation.errors[0], // Show first error
          variant: "destructive",
          duration: 3000,
        });
      }

      setValidationState({
        isValidating: false,
        lastValidation: validation
      });

      return validation;

    } catch (error) {
      console.error('Validation request failed:', error);
      // Fail open - allow request if validator fails
      const fallbackResponse: ValidationResponse = {
        valid: true,
        errors: [],
        sanitized: data
      };
      setValidationState({
        isValidating: false,
        lastValidation: fallbackResponse
      });
      return fallbackResponse;
    }
  }, [toast]);

  const validateAndSanitize = useCallback(async (
    data: unknown,
    schemaType: SchemaType
  ): Promise<{ valid: boolean; sanitized: unknown; errors: string[] }> => {
    const validation = await validateRequest(data, schemaType);
    
    return {
      valid: validation.valid,
      sanitized: validation.sanitized || data,
      errors: validation.errors
    };
  }, [validateRequest]);

  const withValidation = useCallback(async <T>(
    data: unknown,
    schemaType: SchemaType,
    operation: (sanitizedData: unknown) => Promise<T>
  ): Promise<T | null> => {
    const validation = await validateRequest(data, schemaType);
    
    if (!validation.valid || validation.securityViolation) {
      return null;
    }

    return await operation(validation.sanitized || data);
  }, [validateRequest]);

  // Client-side validation helpers for immediate feedback
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validatePhone = useCallback((phone: string): boolean => {
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    return phoneRegex.test(phone);
  }, []);

  const validateRequired = useCallback((value: unknown): boolean => {
    return value !== null && value !== undefined && value !== '';
  }, []);

  const getLastValidationErrors = useCallback(() => {
    return validationState.lastValidation?.errors || [];
  }, [validationState.lastValidation]);

  return {
    validateRequest,
    validateAndSanitize,
    withValidation,
    validateEmail,
    validatePhone,
    validateRequired,
    getLastValidationErrors,
    isValidating: validationState.isValidating,
    lastValidation: validationState.lastValidation
  };
}