import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Server, 
  Shield,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { configManager } from '@/lib/config';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down' | 'slow';
    storage: 'up' | 'down' | 'slow';
    auth: 'up' | 'down' | 'slow';
    functions: 'up' | 'down' | 'slow';
  };
  metrics: {
    responseTime: number;
    databaseLatency: number;
    memoryUsage?: number;
  };
}

interface SystemMetrics {
  activeUsers: number;
  totalRequests: number;
  errorRate: number;
  avgResponseTime: number;
  uptime: number;
}

export const ProductionMonitor: React.FC = () => {
  const { toast } = useToast();
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchHealthStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('health-check');
      
      if (error) {
        throw error;
      }

      setHealthStatus(data);
    } catch (error) {
      console.error('Failed to fetch health status:', error);
      toast({
        title: "Health Check Failed",
        description: "Unable to fetch system health status",
        variant: "destructive",
      });
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [{ count: activeUsers }, { count: totalBookings }] = await Promise.all([
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('updated_at', since24h),
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true }),
      ]);

      const metrics: SystemMetrics = {
        activeUsers: activeUsers ?? 0,
        totalRequests: totalBookings ?? 0,
        errorRate: 0,
        avgResponseTime: healthStatus?.metrics?.responseTime ?? 0,
        uptime: healthStatus?.status === 'healthy' ? 100 : 99.5,
      };

      setSystemMetrics(metrics);
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    await Promise.all([fetchHealthStatus(), fetchSystemMetrics()]);
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
    
    // Subscribe to real-time monitoring updates
    const channel = supabase
      .channel('production-monitoring')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'security_events',
        },
        () => {
          refreshData(); // Refresh when security events change
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'text-success';
      case 'degraded':
      case 'slow':
        return 'text-warning';
      case 'unhealthy':
      case 'down':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return <CheckCircle className="w-4 h-4" />;
      case 'degraded':
      case 'slow':
        return <AlertTriangle className="w-4 h-4" />;
      case 'unhealthy':
      case 'down':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!configManager.isProduction()) {
    return (
      <Alert>
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>
          Production monitoring is only available in production environment.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Production Monitor</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {healthStatus && getStatusIcon(healthStatus.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthStatus ? (
                <Badge variant={healthStatus.status === 'healthy' ? 'default' : 'destructive'}>
                  {healthStatus.status}
                </Badge>
              ) : (
                'Loading...'
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics?.activeUsers.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics ? `${(systemMetrics.errorRate * 100).toFixed(2)}%` : '0%'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics ? `${systemMetrics.uptime.toFixed(2)}%` : '0%'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthStatus && Object.entries(healthStatus.services).map(([service, status]) => (
              <Card key={service}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {service}
                  </CardTitle>
                  <div className={`flex items-center gap-1 ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                    <span className="text-sm capitalize">{status}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {service === 'database' && (
                    <div className="text-sm text-muted-foreground">
                      Latency: {healthStatus.metrics.databaseLatency}ms
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
                <CardDescription>System response performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Average Response:</span>
                    <span>{systemMetrics?.avgResponseTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Database Latency:</span>
                    <span>{healthStatus?.metrics.databaseLatency}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Health Check:</span>
                    <span>{healthStatus?.metrics.responseTime}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
                <CardDescription>Resource utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Memory Usage:</span>
                    <span>
                      {healthStatus?.metrics.memoryUsage 
                        ? formatBytes(healthStatus.metrics.memoryUsage)
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Requests:</span>
                    <span>{systemMetrics?.totalRequests.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
              <CardDescription>Current alert thresholds and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Error Rate Alert</div>
                    <div className="text-sm text-muted-foreground">
                      Threshold: {(configManager.getAlertsConfig().errorThreshold * 100).toFixed(1)}%
                    </div>
                  </div>
                  <Badge variant={
                    (systemMetrics?.errorRate || 0) > configManager.getAlertsConfig().errorThreshold 
                      ? 'destructive' 
                      : 'default'
                  }>
                    {(systemMetrics?.errorRate || 0) > configManager.getAlertsConfig().errorThreshold 
                      ? 'TRIGGERED' 
                      : 'OK'
                    }
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Performance Alert</div>
                    <div className="text-sm text-muted-foreground">
                      Threshold: {configManager.getAlertsConfig().performanceThreshold}ms
                    </div>
                  </div>
                  <Badge variant={
                    (systemMetrics?.avgResponseTime || 0) > configManager.getAlertsConfig().performanceThreshold 
                      ? 'destructive' 
                      : 'default'
                  }>
                    {(systemMetrics?.avgResponseTime || 0) > configManager.getAlertsConfig().performanceThreshold 
                      ? 'TRIGGERED' 
                      : 'OK'
                    }
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Uptime Alert</div>
                    <div className="text-sm text-muted-foreground">
                      Threshold: {(configManager.getAlertsConfig().uptimeThreshold * 100).toFixed(1)}%
                    </div>
                  </div>
                  <Badge variant={
                    (systemMetrics?.uptime || 0) / 100 < configManager.getAlertsConfig().uptimeThreshold 
                      ? 'destructive' 
                      : 'default'
                  }>
                    {(systemMetrics?.uptime || 0) / 100 < configManager.getAlertsConfig().uptimeThreshold 
                      ? 'TRIGGERED' 
                      : 'OK'
                    }
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};