import React, { useEffect, useState } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Zap, 
  Clock, 
  Gauge, 
  Wifi, 
  HardDrive, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface PerformanceMonitorProps {
  showDetails?: boolean;
  onOptimizationNeeded?: (recommendations: string[]) => void;
}

export function PerformanceMonitor({ showDetails = false, onOptimizationNeeded }: PerformanceMonitorProps) {
  const { metrics, performanceScore, getPerformanceReport, measureWebVitals } = usePerformanceMonitor('PerformanceMonitor');
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    const report = getPerformanceReport();
    if (report.recommendations.length > 0 && onOptimizationNeeded) {
      onOptimizationNeeded(report.recommendations.map(r => r.message));
    }
  }, [metrics, onOptimizationNeeded, getPerformanceReport]);

  const report = getPerformanceReport();
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (score >= 70) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {getScoreIcon(performanceScore)}
        <span className={getScoreColor(performanceScore)}>
          Performance: {performanceScore}/100
        </span>
        <Badge variant={performanceScore >= 90 ? 'default' : performanceScore >= 70 ? 'secondary' : 'destructive'}>
          {report.grade}
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              <CardTitle>Performance Overview</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={measureWebVitals}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          <CardDescription>
            Real-time performance metrics and Core Web Vitals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              <span className="font-medium">Overall Score</span>
            </div>
            <div className="flex items-center gap-2">
              {getScoreIcon(performanceScore)}
              <span className={`font-bold ${getScoreColor(performanceScore)}`}>
                {performanceScore}/100
              </span>
              <Badge variant={performanceScore >= 90 ? 'default' : performanceScore >= 70 ? 'secondary' : 'destructive'}>
                Grade {report.grade}
              </Badge>
            </div>
          </div>

          <Progress value={performanceScore} className="h-2" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm">
                <Zap className="w-3 h-3" />
                <span>FCP</span>
              </div>
              <div className="text-lg font-semibold">
                {metrics?.fcp ? `${(metrics.fcp / 1000).toFixed(1)}s` : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">First Contentful Paint</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm">
                <Clock className="w-3 h-3" />
                <span>LCP</span>
              </div>
              <div className="text-lg font-semibold">
                {metrics?.lcp ? `${(metrics.lcp / 1000).toFixed(1)}s` : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Largest Contentful Paint</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm">
                <Activity className="w-3 h-3" />
                <span>FID</span>
              </div>
              <div className="text-lg font-semibold">
                {metrics?.fid ? `${metrics.fid.toFixed(1)}ms` : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">First Input Delay</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm">
                <Gauge className="w-3 h-3" />
                <span>CLS</span>
              </div>
              <div className="text-lg font-semibold">
                {metrics?.cls ? metrics.cls.toFixed(3) : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Cumulative Layout Shift</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm">
                <Clock className="w-3 h-3" />
                <span>Load Complete</span>
              </div>
              <div className="text-sm font-medium">
                {metrics?.loadComplete ? `${metrics.loadComplete.toFixed(0)}ms` : 'N/A'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm">
                <HardDrive className="w-3 h-3" />
                <span>TTFB</span>
              </div>
              <div className="text-sm font-medium">
                {metrics?.ttfb ? `${metrics.ttfb.toFixed(0)}ms` : 'N/A'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm">
                <Wifi className="w-3 h-3" />
                <span>Status</span>
              </div>
              <div className="text-sm font-medium">
                Online
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {report.recommendations.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Performance optimization recommended</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowRecommendations(!showRecommendations)}
            >
              {showRecommendations ? 'Hide' : 'Show'} Details
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {showRecommendations && report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Recommendations</CardTitle>
            <CardDescription>
              Suggestions to improve your app's performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>{recommendation.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}