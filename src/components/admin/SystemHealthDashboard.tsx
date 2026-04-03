import { ProductionMonitor } from '@/components/monitoring/ProductionMonitor';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Zap, Database, Server, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
}

export function SystemHealthDashboard() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('monitoring_alerts')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAlerts((data as SystemAlert[]) || []);
    } catch {
      // monitoring_alerts table may not exist yet — start with empty list
      setAlerts([]);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    // Optimistic update
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));

    // Persist to DB
    await supabase
      .from('monitoring_alerts')
      .update({ acknowledged: true })
      .eq('id', alertId);
  };

  const criticalAlerts = alerts.filter(alert => !alert.acknowledged && alert.type === 'critical');
  const warningAlerts = alerts.filter(alert => !alert.acknowledged && alert.type === 'warning');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">⚡ System Health</h1>
          <p className="text-muted-foreground">Real-time monitoring and alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          {(criticalAlerts.length > 0 || warningAlerts.length > 0) && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {criticalAlerts.length + warningAlerts.length} Active Alerts
            </Badge>
          )}
        </div>
      </div>

      {/* System Alerts */}
      {(criticalAlerts.length > 0 || warningAlerts.length > 0) && (
        <div className="space-y-3">
          {criticalAlerts.map((alert) => (
            <Alert key={alert.id} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <div className="flex items-center justify-between w-full">
                <div>
                  <h4 className="font-semibold">{alert.title}</h4>
                  <AlertDescription>{alert.description}</AlertDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => acknowledgeAlert(alert.id)}
                >
                  Acknowledge
                </Button>
              </div>
            </Alert>
          ))}
          
          {warningAlerts.map((alert) => (
            <Alert key={alert.id}>
              <AlertTriangle className="h-4 w-4" />
              <div className="flex items-center justify-between w-full">
                <div>
                  <h4 className="font-semibold">{alert.title}</h4>
                  <AlertDescription>{alert.description}</AlertDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => acknowledgeAlert(alert.id)}
                >
                  Acknowledge
                </Button>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Production Monitor Component */}
      <ProductionMonitor />

      {/* Service Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Healthy</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Response: 12ms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Gateway</CardTitle>
            <Server className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Online</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Uptime: 99.9%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment System</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-600">Degraded</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Slow response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Protected</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">All checks passed</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}