/**
 * Sentry integration for production error tracking
 */

import { configManager } from '@/lib/config';

interface SentryConfig {
  dsn?: string;
  environment: string;
  sampleRate: number;
  beforeSend?: (event: any) => any;
}

class SentryManager {
  private static instance: SentryManager;
  private initialized = false;
  private config: SentryConfig;

  private constructor() {
    const appConfig = configManager.getConfig();
    this.config = {
      environment: appConfig.environment,
      sampleRate: appConfig.monitoring.performance.sampleRate,
      beforeSend: this.filterEvent.bind(this),
    };
  }

  public static getInstance(): SentryManager {
    if (!SentryManager.instance) {
      SentryManager.instance = new SentryManager();
    }
    return SentryManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized || !configManager.isProduction()) {
      return;
    }

    try {
      // In production, DSN will come from Supabase secrets via edge function
      const sentryDsn = await this.getSentryDsn();
      if (!sentryDsn) {
        console.warn('Sentry DSN not available, skipping initialization');
        return;
      }

      // Mock Sentry initialization (in real app, you'd use @sentry/react)
      console.log('Sentry initialized for production monitoring');
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  private async getSentryDsn(): Promise<string | null> {
    try {
      // This would call an edge function to get the secret
      // For now, we'll simulate this
      return null; // Would be populated by edge function
    } catch (error) {
      console.error('Failed to get Sentry DSN:', error);
      return null;
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

    // Remove sensitive data
    if (event.user) {
      delete event.user.email;
      delete event.user.id;
    }

    return event;
  }

  public captureError(error: Error, context?: Record<string, any>): void {
    if (!this.initialized && configManager.isProduction()) {
      console.error('Sentry not initialized, logging error:', error, context);
      return;
    }

    // In development, just log to console
    if (!configManager.isProduction()) {
      console.error('Development Error:', error, context);
      return;
    }

    // In production, this would send to Sentry
    console.error('Production Error (would send to Sentry):', error, context);
  }

  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!configManager.isProduction()) {
      console.log(`Development ${level}:`, message);
      return;
    }

    console.log(`Production ${level} (would send to Sentry):`, message);
  }

  public setUserContext(user: { id: string; email?: string }): void {
    if (configManager.isProduction()) {
      // Would set user context in Sentry
      console.log('Setting user context for monitoring');
    }
  }

  public addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
    if (configManager.isProduction()) {
      // Would add breadcrumb to Sentry
      console.log('Adding breadcrumb:', { message, category, data });
    }
  }
}

export const sentryManager = SentryManager.getInstance();

// Initialize on module load
sentryManager.initialize();