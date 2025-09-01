import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ShieldAlert, ShieldCheck, Eye, Lock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  event_details: any;
  created_at: string;
  user_id?: string;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highEvents: number;
  mediumEvents: number;
  lowEvents: number;
  recentEvents: SecurityEvent[];
}

export function SecurityMonitor() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityMetrics();
    
    // Set up real-time monitoring
    const channel = supabase
      .channel('security-events')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'security_events' },
        (payload) => {
          handleNewSecurityEvent(payload.new as SecurityEvent);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSecurityMetrics = async () => {
    try {
      setLoading(true);

      // Get security events from the last 24 hours
        const { data: events, error } = await supabase
          .from('security_events')
          .select('*')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;

        const securityMetrics: SecurityMetrics = {
          totalEvents: events?.length || 0,
          criticalEvents: events?.filter((e: any) => e.severity === 'critical').length || 0,
          highEvents: events?.filter((e: any) => e.severity === 'high').length || 0,
          mediumEvents: events?.filter((e: any) => e.severity === 'medium').length || 0,
          lowEvents: events?.filter((e: any) => e.severity === 'low').length || 0,
          recentEvents: (events || []).slice(0, 10).map((e: any) => ({
            id: e.id,
            event_type: e.event_type,
            severity: e.severity as 'low' | 'medium' | 'high' | 'critical',
            event_details: e.event_details,
            created_at: e.created_at,
            user_id: e.user_id
          })),
        };

      setMetrics(securityMetrics);
    } catch (error) {
      console.error('Failed to load security metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load security metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewSecurityEvent = (event: SecurityEvent) => {
    setMetrics(prev => {
      if (!prev) return null;

      const newMetrics = {
        ...prev,
        totalEvents: prev.totalEvents + 1,
        recentEvents: [event, ...prev.recentEvents.slice(0, 9)],
      };

      // Update severity counters
      switch (event.severity) {
        case 'critical':
          newMetrics.criticalEvents += 1;
          break;
        case 'high':
          newMetrics.highEvents += 1;
          break;
        case 'medium':
          newMetrics.mediumEvents += 1;
          break;
        case 'low':
          newMetrics.lowEvents += 1;
          break;
      }

      return newMetrics;
    });

    // Show notification for high/critical events
    if (event.severity === 'critical' || event.severity === 'high') {
      toast({
        title: "Security Alert",
        description: `${event.event_type} - ${event.severity.toUpperCase()} severity`,
        variant: "destructive",
      });
    }
  };

  const runSecurityScan = async () => {
    setScanning(true);
    try {
      // Trigger security scan edge function
      const { error } = await supabase.functions.invoke('security-scan');
      
      if (error) throw error;

      toast({
        title: "Security Scan",
        description: "Security scan initiated successfully",
      });

      // Reload metrics after scan
      setTimeout(() => {
        loadSecurityMetrics();
      }, 2000);

    } catch (error) {
      console.error('Security scan failed:', error);
      toast({
        title: "Scan Failed",
        description: "Failed to initiate security scan",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case 'high':
        return <ShieldAlert className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Shield className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <ShieldCheck className="w-4 h-4 text-green-500" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading security metrics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load security metrics. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Overview (24h)
            </CardTitle>
            <Button 
              onClick={runSecurityScan} 
              disabled={scanning}
              size="sm"
              variant="outline"
            >
              {scanning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Scanning...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Run Scan
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.totalEvents}</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{metrics.criticalEvents}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{metrics.highEvents}</div>
              <div className="text-sm text-muted-foreground">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{metrics.mediumEvents}</div>
              <div className="text-sm text-muted-foreground">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{metrics.lowEvents}</div>
              <div className="text-sm text-muted-foreground">Low</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.criticalEvents === 0 && metrics.highEvents === 0 ? (
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                  No critical or high-severity security events detected in the last 24 hours.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription>
                  {metrics.criticalEvents > 0 && `${metrics.criticalEvents} critical`}
                  {metrics.criticalEvents > 0 && metrics.highEvents > 0 && ' and '}
                  {metrics.highEvents > 0 && `${metrics.highEvents} high`}
                  {' '}severity security events detected. Immediate attention required.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.recentEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No recent security events</p>
          ) : (
            <div className="space-y-3">
              {metrics.recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(event.severity)}
                    <div>
                      <div className="font-medium">{formatEventType(event.event_type)}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getSeverityColor(event.severity) as any}>
                    {event.severity.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}