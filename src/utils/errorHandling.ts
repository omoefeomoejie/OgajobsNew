// Strict TypeScript error handling utilities

import type { ErrorWithMessage, SupabaseError } from '@/types/common';

/**
 * Type guard to check if error has message property
 */
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ErrorWithMessage).message === 'string'
  );
}

/**
 * Type guard for Supabase errors
 */
export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    isErrorWithMessage(error) &&
    typeof error === 'object' &&
    'code' in error
  );
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}

/**
 * Enhanced error handler for async operations with proper typing
 */
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  fallbackValue?: T
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    console.error('Async operation failed:', getErrorMessage(error));
    return fallbackValue ?? null;
  }
}

/**
 * Error boundary compatible error formatter
 */
export function formatErrorForBoundary(error: unknown): {
  message: string;
  stack?: string;
  code?: string;
} {
  const message = getErrorMessage(error);
  
  if (error instanceof Error) {
    return {
      message,
      stack: error.stack,
    };
  }

  if (isSupabaseError(error)) {
    return {
      message,
      code: error.code,
    };
  }

  return { message };
}

/**
 * Network/API error handler
 */
export function handleNetworkError(error: unknown): {
  isNetworkError: boolean;
  isTimeout: boolean;
  statusCode?: number;
  message: string;
} {
  const message = getErrorMessage(error);
  
  // Check for common network error patterns
  const isNetworkError = message.includes('fetch') || 
                        message.includes('network') ||
                        message.includes('connection');
                        
  const isTimeout = message.includes('timeout') || 
                   message.includes('aborted');

  let statusCode: number | undefined;
  
  if (isErrorWithMessage(error) && 'statusCode' in error) {
    statusCode = error.statusCode as number;
  }

  return {
    isNetworkError,
    isTimeout,
    statusCode,
    message
  };
}

/**
 * Validation error handler
 */
export function handleValidationError(error: unknown): {
  isValidationError: boolean;
  fieldErrors: Record<string, string>;
  message: string;
} {
  const message = getErrorMessage(error);
  
  const isValidationError = message.includes('validation') ||
                           message.includes('required') ||
                           message.includes('invalid');

  // Extract field-specific errors if available
  let fieldErrors: Record<string, string> = {};
  
  if (typeof error === 'object' && error !== null && 'fieldErrors' in error) {
    fieldErrors = error.fieldErrors as Record<string, string>;
  }

  return {
    isValidationError,
    fieldErrors,
    message
  };
}

/**
 * Retry logic with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}