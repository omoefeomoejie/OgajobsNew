import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlertRule {
  id: string;
  name: string;
  condition: 'error_rate' | 'response_time' | 'uptime' | 'database_latency';
  threshold: number;
  enabled: boolean;
  notifications: {
    email?: string[];
    webhook?: string;
  };
}

interface MetricData {
  errorRate: number;
  avgResponseTime: number;
  uptime: number;
  databaseLatency: number;
  timestamp: string;
}

interface AlertEvent {
  ruleId: string;
  ruleName: string;
  condition: string;
  currentValue: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'check';

    switch (action) {
      case 'check':
        return await checkAlerts(supabase);
      
      case 'rules':
        return await getAlertRules(supabase);
      
      case 'history':
        return await getAlertHistory(supabase);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }), 
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }

  } catch (error) {
    console.error('Monitoring alerts error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function checkAlerts(supabase: any) {
  try {
    // Get current system metrics (simulate for now)
    const metrics: MetricData = {
      errorRate: Math.random() * 0.1, // 0-10%
      avgResponseTime: Math.random() * 1000 + 200, // 200-1200ms
      uptime: 99.5 + Math.random() * 0.5, // 99.5-100%
      databaseLatency: Math.random() * 100 + 50, // 50-150ms
      timestamp: new Date().toISOString(),
    };

    // Define alert rules (in production, these would come from database)
    const alertRules: AlertRule[] = [
      {
        id: 'error_rate_high',
        name: 'High Error Rate',
        condition: 'error_rate',
        threshold: 0.05, // 5%
        enabled: true,
        notifications: {
          email: ['admin@ogajobs.ng'],
        },
      },
      {
        id: 'response_time_slow',
        name: 'Slow Response Time',
        condition: 'response_time',
        threshold: 3000, // 3 seconds
        enabled: true,
        notifications: {
          email: ['admin@ogajobs.ng'],
        },
      },
      {
        id: 'uptime_low',
        name: 'Low Uptime',
        condition: 'uptime',
        threshold: 99.0, // 99%
        enabled: true,
        notifications: {
          email: ['admin@ogajobs.ng'],
        },
      },
      {
        id: 'database_slow',
        name: 'Database Latency High',
        condition: 'database_latency',
        threshold: 1000, // 1 second
        enabled: true,
        notifications: {
          email: ['admin@ogajobs.ng'],
        },
      },
    ];

    const triggeredAlerts: AlertEvent[] = [];

    // Check each rule
    for (const rule of alertRules) {
      if (!rule.enabled) continue;

      let currentValue = 0;
      let isTriggered = false;

      switch (rule.condition) {
        case 'error_rate':
          currentValue = metrics.errorRate;
          isTriggered = currentValue > rule.threshold;
          break;
        case 'response_time':
          currentValue = metrics.avgResponseTime;
          isTriggered = currentValue > rule.threshold;
          break;
        case 'uptime':
          currentValue = metrics.uptime;
          isTriggered = currentValue < rule.threshold;
          break;
        case 'database_latency':
          currentValue = metrics.databaseLatency;
          isTriggered = currentValue > rule.threshold;
          break;
      }

      if (isTriggered) {
        const alertEvent: AlertEvent = {
          ruleId: rule.id,
          ruleName: rule.name,
          condition: rule.condition,
          currentValue,
          threshold: rule.threshold,
          severity: getSeverity(rule.condition, currentValue, rule.threshold),
          timestamp: new Date().toISOString(),
        };

        triggeredAlerts.push(alertEvent);

        // Send notifications (simulate for now)
        await sendNotification(rule, alertEvent);

        // Log alert to database (simulate)
        console.log('Alert triggered:', alertEvent);
      }
    }

    // Log metrics and alerts
    console.log('Metrics check completed:', {
      metrics,
      alertsTriggered: triggeredAlerts.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        metrics,
        alertsTriggered: triggeredAlerts,
        totalRules: alertRules.length,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error checking alerts:', error);
    throw error;
  }
}

async function getAlertRules(supabase: any) {
  // Return mock alert rules (in production, fetch from database)
  const rules: AlertRule[] = [
    {
      id: 'error_rate_high',
      name: 'High Error Rate',
      condition: 'error_rate',
      threshold: 0.05,
      enabled: true,
      notifications: { email: ['admin@ogajobs.ng'] },
    },
    {
      id: 'response_time_slow',
      name: 'Slow Response Time',
      condition: 'response_time',
      threshold: 3000,
      enabled: true,
      notifications: { email: ['admin@ogajobs.ng'] },
    },
  ];

  return new Response(
    JSON.stringify({ rules }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function getAlertHistory(supabase: any) {
  // Return mock alert history (in production, fetch from database)
  const history: AlertEvent[] = [
    {
      ruleId: 'error_rate_high',
      ruleName: 'High Error Rate',
      condition: 'error_rate',
      currentValue: 0.08,
      threshold: 0.05,
      severity: 'high',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    }
  ];

  return new Response(
    JSON.stringify({ history }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

function getSeverity(condition: string, currentValue: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
  const ratio = Math.abs(currentValue / threshold);
  
  if (ratio > 2) return 'critical';
  if (ratio > 1.5) return 'high';
  if (ratio > 1.2) return 'medium';
  return 'low';
}

async function sendNotification(rule: AlertRule, alert: AlertEvent) {
  // In production, this would send actual notifications
  console.log('Sending notification for alert:', {
    rule: rule.name,
    alert: alert.condition,
    severity: alert.severity,
    notifications: rule.notifications,
  });

  // Example: Send email notification (would use actual email service)
  if (rule.notifications.email) {
    for (const email of rule.notifications.email) {
      console.log(`Email notification sent to ${email}:`, {
        subject: `[${alert.severity.toUpperCase()}] ${rule.name}`,
        body: `Alert: ${rule.name}\nCondition: ${alert.condition}\nCurrent Value: ${alert.currentValue}\nThreshold: ${alert.threshold}\nTime: ${alert.timestamp}`,
      });
    }
  }

  // Example: Send webhook notification
  if (rule.notifications.webhook) {
    console.log(`Webhook notification sent to ${rule.notifications.webhook}:`, alert);
  }
}