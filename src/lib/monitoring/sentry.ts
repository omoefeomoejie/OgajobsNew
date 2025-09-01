/**
 * Sentry integration for production error tracking
 */

import * as Sentry from '@sentry/react';
import { supabase } from '@/integrations/supabase/client';
import { configManager } from '@/lib/config';

interface SentryConfig {
  dsn: string | null;
  enabled: boolean;
  environment?: string;
}

class SentryManager {
  private static instance: SentryManager;
  private initialized = false;
  private enabled = false;
  private config: SentryConfig | null = null;

  private constructor() {}

  public static getInstance(): SentryManager {
    if (!SentryManager.instance) {
      SentryManager.instance = new SentryManager();
    }
    return SentryManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.config = await this.getSentryConfig();
      
      if (this.config.enabled && this.config.dsn) {
        // Initialize real Sentry
        Sentry.init({
          dsn: this.config.dsn,
          environment: this.config.environment || configManager.getConfig().environment,
          tracesSampleRate: configManager.getConfig().monitoring.performance.sampleRate,
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
          integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
          ],
          beforeSend: this.filterEvent.bind(this),
        });
        
        this.enabled = true;
        // Sentry initialized successfully
      } else {
        // Sentry disabled - no DSN configured
        this.enabled = false;
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
      this.enabled = false;
      this.initialized = true;
    }
  }

  private async getSentryConfig(): Promise<SentryConfig> {
    try {
      const { data, error } = await supabase.functions.invoke('get-sentry-dsn');
      
      if (error) {
        console.error('Error fetching Sentry config:', error);
        return { dsn: null, enabled: false };
      }
      
      return data || { dsn: null, enabled: false };
    } catch (error) {
      console.error('Failed to get Sentry config:', error);
      return { dsn: null, enabled: false };
    }
  }

  private filterEvent(event: any): any {
    // Filter out noise and sensitive data
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.type === 'ChunkLoadError' || error?.value?.includes('Loading chunk')) {
        return null; // Don't send chunk load errors
      }
    }

    // Remove sensitive data but keep user ID for tracking
    if (event.user) {
      const userContext = { ...event.user };
      if (userContext.email) {
        userContext.email = userContext.email.replace(/(.{2}).*@/, '$1***@');
      }
      event.user = userContext;
    }

    return event;
  }

  public captureError(error: Error, context?: Record<string, any>): void {
    if (!this.enabled) {
      // Fallback to console logging
      console.error('Error (Sentry disabled):', error, context);
      return;
    }
    
    if (context) {
      Sentry.withScope((scope) => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  }

  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>): void {
    if (!this.enabled) {
      // Message logged (Sentry disabled)
      return;
    }
    
    if (context) {
      Sentry.withScope((scope) => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
        Sentry.captureMessage(message, level);
      });
    } else {
      Sentry.captureMessage(message, level);
    }
  }

  public setUserContext(user: { id: string; email?: string; username?: string }): void {
    if (!this.enabled) return;
    
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }

  public addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
    if (!this.enabled) return;
    
    Sentry.addBreadcrumb({
      message,
      category,
      level: 'info',
      data,
    });
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // Add method to manually flush events (useful for critical errors)
  public async flush(timeout = 2000): Promise<boolean> {
    if (!this.enabled) return true;
    
    return await Sentry.flush(timeout);
  }
}

export const sentryManager = SentryManager.getInstance();

// Initialize on module load
sentryManager.initialize();