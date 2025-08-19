import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bug, 
  AlertTriangle, 
  XCircle, 
  Clock,
  BarChart3,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface ErrorEvent {
  id: string;
  message: string;
  stack?: string;
  timestamp: Date;
  url: string;
  userAgent: string;
  component?: string;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ErrorStats {
  totalErrors: number;
  uniqueErrors: number;
  errorRate: number;
  recentErrors: ErrorEvent[];
  topErrors: ErrorEvent[];
  trend: 'up' | 'down' | 'stable';
}

export function ErrorTracker() {
  const [errorStats, setErrorStats] = useState<ErrorStats>({
    totalErrors: 0,
    uniqueErrors: 0,
    errorRate: 0,
    recentErrors: [],
    topErrors: [],
    trend: 'stable'
  });
  const [isTracking, setIsTracking] = useState(true);

  useEffect(() => {
    const errorLog: ErrorEvent[] = [];
    
    const handleGlobalError = (event: ErrorEvent) => {
      const errorEvent: ErrorEvent = {
        id: Date.now().toString(36),
        message: event.message || 'Unknown error',
        stack: event.error?.stack,
        timestamp: new Date(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        count: 1,
        severity: getSeverity(event.message || ''),
      };

      // Check if this error already exists
      const existingError = errorLog.find(e => e.message === errorEvent.message);
      if (existingError) {
        existingError.count++;
        existingError.timestamp = new Date();
      } else {
        errorLog.push(errorEvent);
      }

      updateErrorStats(errorLog);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorEvent: ErrorEvent = {
        id: Date.now().toString(36),
        message: event.reason?.message || event.reason || 'Unhandled promise rejection',
        timestamp: new Date(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        count: 1,
        severity: getSeverity(event.reason?.message || ''),
      };

      const existingError = errorLog.find(e => e.message === errorEvent.message);
      if (existingError) {
        existingError.count++;
        existingError.timestamp = new Date();
      } else {
        errorLog.push(errorEvent);
      }

      updateErrorStats(errorLog);
    };

    if (isTracking) {
      window.addEventListener('error', handleGlobalError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
    }

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isTracking]);

  const getSeverity = (message: string): ErrorEvent['severity'] => {
    if (message.includes('ChunkLoadError') || message.includes('Loading chunk')) {
      return 'medium';
    }
    if (message.includes('Network Error') || message.includes('fetch')) {
      return 'low';
    }
    if (message.includes('TypeError') || message.includes('ReferenceError')) {
      return 'high';
    }
    if (message.includes('SecurityError') || message.includes('Permission denied')) {
      return 'critical';
    }
    return 'medium';
  };

  const updateErrorStats = (errors: ErrorEvent[]) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentErrors = errors.filter(e => e.timestamp > oneHourAgo);
    
    // Calculate error rate (errors per hour)
    const errorRate = recentErrors.length;
    
    // Get top errors by count
    const topErrors = [...errors]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate trend (simplified)
    const trend: 'up' | 'down' | 'stable' = errorRate > 10 ? 'up' : errorRate < 2 ? 'down' : 'stable';

    setErrorStats({
      totalErrors: errors.reduce((sum, e) => sum + e.count, 0),
      uniqueErrors: errors.length,
      errorRate,
      recentErrors: recentErrors.slice(0, 10),
      topErrors,
      trend
    });
  };

  const getSeverityColor = (severity: ErrorEvent['severity']) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getTrendIcon = () => {
    switch (errorStats.trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <BarChart3 className="w-4 h-4 text-blue-500" />;
    }
  };

  const clearErrors = () => {
    setErrorStats({
      totalErrors: 0,
      uniqueErrors: 0,
      errorRate: 0,
      recentErrors: [],
      topErrors: [],
      trend: 'stable'
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5" />
              <CardTitle>Error Tracking</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTracking(!isTracking)}
              >
                {isTracking ? 'Pause' : 'Resume'}
              </Button>
              <Button variant="outline" size="sm" onClick={clearErrors}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
          <CardDescription>
            Real-time error monitoring and analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm">
                <XCircle className="w-3 h-3" />
                <span>Total Errors</span>
              </div>
              <div className="text-2xl font-bold">{errorStats.totalErrors}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm">
                <Bug className="w-3 h-3" />
                <span>Unique Errors</span>
              </div>
              <div className="text-2xl font-bold">{errorStats.uniqueErrors}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm">
                <Clock className="w-3 h-3" />
                <span>Error Rate</span>
              </div>
              <div className="text-2xl font-bold">{errorStats.errorRate}/hr</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm">
                {getTrendIcon()}
                <span>Trend</span>
              </div>
              <div className="text-sm font-medium capitalize">{errorStats.trend}</div>
            </div>
          </div>

          {errorStats.errorRate > 5 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                High error rate detected! {errorStats.errorRate} errors in the last hour.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {errorStats.topErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Errors</CardTitle>
            <CardDescription>Most frequent errors in your application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {errorStats.topErrors.map((error) => (
                <div key={error.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(error.severity)}>
                        {error.severity}
                      </Badge>
                      <span className="text-sm font-medium">Count: {error.count}</span>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {error.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last seen: {error.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {errorStats.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Errors</CardTitle>
            <CardDescription>Errors from the last hour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errorStats.recentErrors.map((error) => (
                <div key={error.id} className="flex items-center justify-between text-sm p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant={getSeverityColor(error.severity)} className="text-xs">
                      {error.severity}
                    </Badge>
                    <span className="font-mono">{error.message}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {error.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}