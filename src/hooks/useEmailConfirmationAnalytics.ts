import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

interface AnalyticsEvent {
  type: 'confirmation_started' | 'resend_attempted' | 'help_accessed' | 'support_contacted' | 'confirmation_completed' | 'confirmation_abandoned';
  email: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ConfirmationMetrics {
  startTime: number;
  resendAttempts: number;
  helpActionsUsed: string[];
  timeToCompletion?: number;
  completionStatus?: 'success' | 'abandoned' | 'failed';
}

class EmailConfirmationAnalytics {
  private metrics: Map<string, ConfirmationMetrics> = new Map();
  private events: AnalyticsEvent[] = [];

  // Track when email confirmation process starts
  trackConfirmationStarted(email: string, metadata?: Record<string, any>) {
    const event: AnalyticsEvent = {
      type: 'confirmation_started',
      email,
      timestamp: Date.now(),
      metadata
    };

    this.events.push(event);
    this.metrics.set(email, {
      startTime: Date.now(),
      resendAttempts: 0,
      helpActionsUsed: []
    });

    logger.info('Email confirmation started', { email, metadata });
    this.sendAnalytics(event);
  }

  // Track resend email attempts
  trackResendAttempt(email: string, attemptNumber: number, metadata?: Record<string, any>) {
    const event: AnalyticsEvent = {
      type: 'resend_attempted',
      email,
      timestamp: Date.now(),
      metadata: { attemptNumber, ...metadata }
    };

    this.events.push(event);
    
    const metrics = this.metrics.get(email);
    if (metrics) {
      metrics.resendAttempts = attemptNumber;
    }

    logger.info('Email resend attempted', { email, attemptNumber, metadata });
    this.sendAnalytics(event);
  }

  // Track help actions (FAQ, support contact, etc.)
  trackHelpAccessed(email: string, helpType: string, metadata?: Record<string, any>) {
    const event: AnalyticsEvent = {
      type: 'help_accessed',
      email,
      timestamp: Date.now(),
      metadata: { helpType, ...metadata }
    };

    this.events.push(event);
    
    const metrics = this.metrics.get(email);
    if (metrics && !metrics.helpActionsUsed.includes(helpType)) {
      metrics.helpActionsUsed.push(helpType);
    }

    logger.info('Help accessed during confirmation', { email, helpType, metadata });
    this.sendAnalytics(event);
  }

  // Track support contact
  trackSupportContacted(email: string, contactMethod: string, metadata?: Record<string, any>) {
    const event: AnalyticsEvent = {
      type: 'support_contacted',
      email,
      timestamp: Date.now(),
      metadata: { contactMethod, ...metadata }
    };

    this.events.push(event);
    this.trackHelpAccessed(email, 'support_contact');

    logger.info('Support contacted during confirmation', { email, contactMethod, metadata });
    this.sendAnalytics(event);
  }

  // Track successful confirmation
  trackConfirmationCompleted(email: string, metadata?: Record<string, any>) {
    const event: AnalyticsEvent = {
      type: 'confirmation_completed',
      email,
      timestamp: Date.now(),
      metadata
    };

    this.events.push(event);
    
    const metrics = this.metrics.get(email);
    if (metrics) {
      metrics.timeToCompletion = Date.now() - metrics.startTime;
      metrics.completionStatus = 'success';
    }

    logger.info('Email confirmation completed', { 
      email, 
      timeToCompletion: metrics?.timeToCompletion,
      resendAttempts: metrics?.resendAttempts,
      helpActionsUsed: metrics?.helpActionsUsed,
      metadata 
    });
    this.sendAnalytics(event);
  }

  // Track abandoned confirmation
  trackConfirmationAbandoned(email: string, reason?: string, metadata?: Record<string, any>) {
    const event: AnalyticsEvent = {
      type: 'confirmation_abandoned',
      email,
      timestamp: Date.now(),
      metadata: { reason, ...metadata }
    };

    this.events.push(event);
    
    const metrics = this.metrics.get(email);
    if (metrics) {
      metrics.completionStatus = 'abandoned';
    }

    logger.warn('Email confirmation abandoned', { email, reason, metadata });
    this.sendAnalytics(event);
  }

  // Get metrics for a specific email
  getMetrics(email: string): ConfirmationMetrics | undefined {
    return this.metrics.get(email);
  }

  // Get all events for debugging
  getAllEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  // Calculate completion rate
  getCompletionRate(): number {
    const completedSessions = Array.from(this.metrics.values()).filter(
      m => m.completionStatus === 'success'
    ).length;
    const totalSessions = this.metrics.size;
    
    return totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
  }

  // Get average time to completion
  getAverageTimeToCompletion(): number {
    const completedSessions = Array.from(this.metrics.values()).filter(
      m => m.completionStatus === 'success' && m.timeToCompletion
    );
    
    if (completedSessions.length === 0) return 0;
    
    const totalTime = completedSessions.reduce((sum, m) => sum + (m.timeToCompletion || 0), 0);
    return totalTime / completedSessions.length;
  }

  // Send analytics to external service (placeholder)
  private sendAnalytics(event: AnalyticsEvent) {
    // In a real app, you would send this to your analytics service
    // For now, we'll just log it and potentially send to Supabase
    
    if (import.meta.env.PROD) {
      // In production, send to analytics service
      this.sendToAnalyticsService(event);
    }
  }

  private async sendToAnalyticsService(event: AnalyticsEvent) {
    try {
      // Placeholder for sending to external analytics service
      // Could be Google Analytics, Mixpanel, PostHog, etc.
      
      // For now, we'll store in localStorage for debugging
      const stored = localStorage.getItem('ogajobs_analytics_events') || '[]';
      const events = JSON.parse(stored);
      events.push(event);
      
      // Keep only last 100 events to prevent localStorage from growing too large
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem('ogajobs_analytics_events', JSON.stringify(events));
    } catch (error) {
      logger.error('Failed to send analytics event', { event, error });
    }
  }
}

// Singleton instance
const analytics = new EmailConfirmationAnalytics();

// React hook for using email confirmation analytics
export function useEmailConfirmationAnalytics(email: string) {
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Track confirmation started only once per email
    if (email && !hasStartedRef.current) {
      analytics.trackConfirmationStarted(email, {
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        url: window.location.href
      });
      hasStartedRef.current = true;
    }

    // Track page unload as potential abandonment
    const handleBeforeUnload = () => {
      const metrics = analytics.getMetrics(email);
      if (metrics && !metrics.completionStatus) {
        analytics.trackConfirmationAbandoned(email, 'page_unload');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [email]);

  return {
    trackResendAttempt: (attemptNumber: number, metadata?: Record<string, any>) => 
      analytics.trackResendAttempt(email, attemptNumber, metadata),
    
    trackHelpAccessed: (helpType: string, metadata?: Record<string, any>) => 
      analytics.trackHelpAccessed(email, helpType, metadata),
    
    trackSupportContacted: (contactMethod: string, metadata?: Record<string, any>) => 
      analytics.trackSupportContacted(email, contactMethod, metadata),
    
    trackConfirmationCompleted: (metadata?: Record<string, any>) => 
      analytics.trackConfirmationCompleted(email, metadata),
    
    trackConfirmationAbandoned: (reason?: string, metadata?: Record<string, any>) => 
      analytics.trackConfirmationAbandoned(email, reason, metadata),
    
    getMetrics: () => analytics.getMetrics(email),
    
    // Analytics insights
    getCompletionRate: () => analytics.getCompletionRate(),
    getAverageTimeToCompletion: () => analytics.getAverageTimeToCompletion(),
    getAllEvents: () => analytics.getAllEvents()
  };
}
