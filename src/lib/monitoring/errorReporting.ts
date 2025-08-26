/**
 * Production-ready error reporting and monitoring
 */

import { configManager } from '@/lib/config';
import { sentryManager } from '@/lib/monitoring/sentry';
import { supabase } from '@/integrations/supabase/client';

interface ErrorReport {
  id: string;
  timestamp: string;
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  context: {
    url: string;
    userAgent: string;
    userId?: string;
    sessionId?: string;
    component?: string;
    action?: string;
    source?: string;
    line?: number;
    componentStack?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  environment: string;
}

class ErrorReportingManager {
  private static instance: ErrorReportingManager;
  private errorQueue: ErrorReport[] = [];
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): ErrorReportingManager {
    if (!ErrorReportingManager.instance) {
      ErrorReportingManager.instance = new ErrorReportingManager();
    }
    return ErrorReportingManager.instance;
  }

  private initialize(): void {
    if (this.isInitialized) return;

    // Set up global error handlers
    this.setupGlobalErrorHandlers();
    
    // Set up unhandled promise rejection handler
    this.setupUnhandledRejectionHandler();

    // Set up periodic error queue flush
    this.setupPeriodicFlush();

    this.isInitialized = true;
    console.log('Error reporting initialized');
  }

  private setupGlobalErrorHandlers(): void {
    // Capture unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        component: 'global',
        action: 'unhandled_error',
        source: event.filename || 'unknown',
        line: event.lineno || 0,
      });
    });

    // Capture React error boundary errors
    window.addEventListener('react-error-boundary', (event: any) => {
      this.captureError(event.detail.error, {
        component: event.detail.errorBoundary || 'unknown',
        action: 'react_error_boundary',
        componentStack: event.detail.componentStack,
      });
    });
  }

  private setupUnhandledRejectionHandler(): void {
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));

      this.captureError(error, {
        component: 'promise',
        action: 'unhandled_rejection',
      });

      // Prevent the error from being logged to console twice
      event.preventDefault();
    });
  }

  private setupPeriodicFlush(): void {
    // Flush error queue every 30 seconds in production
    if (configManager.isProduction()) {
      setInterval(() => {
        this.flushErrorQueue();
      }, 30000);
    }

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushErrorQueue();
    });
  }

  public captureError(
    error: Error | string, 
    context: Partial<ErrorReport['context']> = {},
    severity: ErrorReport['severity'] = 'medium'
  ): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    const report: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      error: {
        message: errorObj.message,
        stack: errorObj.stack,
        name: errorObj.name,
      },
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.getCurrentUserId(),
        sessionId: this.getSessionId(),
        ...context,
      },
      severity,
      environment: configManager.getConfig().environment,
    };

    // Add to queue for batch processing
    this.errorQueue.push(report);

    // Send to Sentry in production and development (if configured)
    if (sentryManager.isEnabled()) {
      sentryManager.captureError(errorObj, context);
    }

    // Log to console in development
    if (!configManager.isProduction()) {
      console.error('Error captured:', report);
    }

    // Auto-flush for critical errors
    if (severity === 'critical') {
      this.flushErrorQueue();
    }
  }

  public captureException(
    error: Error, 
    context: Partial<ErrorReport['context']> = {}
  ): void {
    this.captureError(error, context, this.determineSeverity(error));
  }

  public captureMessage(
    message: string, 
    severity: ErrorReport['severity'] = 'low',
    context: Partial<ErrorReport['context']> = {}
  ): void {
    const sentryLevel = severity === 'critical' ? 'error' : 
                        severity === 'high' ? 'error' :
                        severity === 'medium' ? 'warning' : 'info';
    
    if (sentryManager.isEnabled()) {
      sentryManager.captureMessage(message, sentryLevel, context);
    } else {
      console.log(`[${severity.toUpperCase()}] ${message}`, context);
    }
  }

  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // In production, send to monitoring service
      if (configManager.isProduction()) {
        await this.sendToMonitoringService(errors);
      }

      // Log batch processing
      console.log(`Flushed ${errors.length} errors to monitoring service`);
    } catch (error) {
      console.error('Failed to flush error queue:', error);
      // Re-add errors to queue for retry
      this.errorQueue.unshift(...errors);
    }
  }

  private async sendToMonitoringService(errors: ErrorReport[]): Promise<void> {
    try {
      // Send to Sentry for each error if enabled
      if (sentryManager.isEnabled()) {
        errors.forEach(errorReport => {
          const error = new Error(errorReport.error.message);
          error.name = errorReport.error.name;
          if (errorReport.error.stack) {
            error.stack = errorReport.error.stack;
          }
          
          sentryManager.captureError(error, {
            component: errorReport.context.component,
            action: errorReport.context.action,
            severity: errorReport.severity,
            userId: errorReport.context.userId,
            url: errorReport.context.url,
            sessionId: errorReport.context.sessionId
          });
        });
      }

      // Send to monitoring alerts edge function as backup/additional logging
      const { error } = await supabase.functions.invoke('monitoring-alerts', {
        body: {
          action: 'report_errors',
          errors: errors.map(err => ({
            ...err,
            // Remove sensitive data
            context: {
              ...err.context,
              userAgent: undefined, // Remove for privacy
            }
          }))
        }
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Failed to send errors to monitoring service:', err);
      throw err;
    }
  }

  private determineSeverity(error: Error): ErrorReport['severity'] {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Critical errors that affect core functionality
    if (
      message.includes('network error') ||
      message.includes('failed to fetch') ||
      message.includes('database') ||
      message.includes('payment') ||
      stack.includes('auth')
    ) {
      return 'critical';
    }

    // High severity for important features
    if (
      message.includes('validation') ||
      message.includes('permission') ||
      message.includes('unauthorized') ||
      stack.includes('booking')
    ) {
      return 'high';
    }

    // Medium for general application errors
    if (
      message.includes('component') ||
      message.includes('render') ||
      error.name === 'TypeError'
    ) {
      return 'medium';
    }

    // Low for minor issues
    return 'low';
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string | undefined {
    try {
      // Get current user from Supabase auth
      const user = supabase.auth.getUser();
      return user ? 'user_available' : undefined; // Don't store actual user ID for privacy
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string {
    // Get or create session ID for error correlation
    let sessionId = sessionStorage.getItem('error_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('error_session_id', sessionId);
    }
    return sessionId;
  }

  public getErrorStats(): {
    queuedErrors: number;
    totalCaptured: number;
    lastFlush: string | null;
  } {
    return {
      queuedErrors: this.errorQueue.length,
      totalCaptured: parseInt(localStorage.getItem('total_errors_captured') || '0'),
      lastFlush: localStorage.getItem('last_error_flush'),
    };
  }
}

// Export singleton instance
export const errorReporting = ErrorReportingManager.getInstance();

// Export wrapper functions for convenience
export const captureError = (error: Error | string, context?: Partial<ErrorReport['context']>) => {
  errorReporting.captureError(error, context);
};

export const captureException = (error: Error, context?: Partial<ErrorReport['context']>) => {
  errorReporting.captureException(error, context);
};

export const captureMessage = (message: string, severity?: ErrorReport['severity']) => {
  errorReporting.captureMessage(message, severity);
};