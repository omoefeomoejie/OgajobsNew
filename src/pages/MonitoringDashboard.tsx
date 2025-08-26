import React from 'react';
import { PerformanceMonitor } from '@/components/monitoring/PerformanceMonitor';
import { ProductionMonitor } from '@/components/monitoring/ProductionMonitor';
import { ErrorTracker } from '@/components/monitoring/ErrorTracker';
import { TestHelper } from '@/components/testing/TestHelper';
import { SentryTestComponent } from '@/components/testing/SentryTestComponent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Bug, TestTube, Server, Shield } from 'lucide-react';
import { configManager } from '@/lib/config';

export default function MonitoringDashboard() {
  const isProduction = configManager.isProduction();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="w-6 h-6" />
        <h1 className="text-3xl font-bold">
          Monitoring Dashboard {isProduction && '(Production)'}
        </h1>
      </div>
      
      <Tabs defaultValue={isProduction ? "production" : "performance"} className="space-y-4">
        <TabsList>
          {isProduction && <TabsTrigger value="production">Production</TabsTrigger>}
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Error Tracking</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>
        
        {isProduction && (
          <TabsContent value="production">
            <ProductionMonitor />
          </TabsContent>
        )}
        
        <TabsContent value="performance">
          <PerformanceMonitor showDetails={true} />
        </TabsContent>
        
        <TabsContent value="errors">
          <ErrorTracker />
        </TabsContent>
        
        <TabsContent value="testing">
          <div className="space-y-6">
            <SentryTestComponent />
            <TestHelper />
          </div>
        </TabsContent>

        <TabsContent value="config">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Environment Configuration
                </CardTitle>
                <CardDescription>Current environment settings and feature flags</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Environment:</span>
                    <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                      {configManager.getConfig().environment}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Sentry Monitoring:</span>
                    <span className={configManager.getMonitoringConfig().sentry.enabled ? 'text-success' : 'text-muted-foreground'}>
                      {configManager.getMonitoringConfig().sentry.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Performance Monitoring:</span>
                    <span className={configManager.getMonitoringConfig().performance.enabled ? 'text-success' : 'text-muted-foreground'}>
                      {configManager.getMonitoringConfig().performance.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Analytics:</span>
                    <span className={configManager.getMonitoringConfig().analytics.enabled ? 'text-success' : 'text-muted-foreground'}>
                      {configManager.getMonitoringConfig().analytics.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Feature Flags
                </CardTitle>
                <CardDescription>Current feature flag status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(configManager.getConfig().features).map(([feature, enabled]) => (
                    <div key={feature} className="flex justify-between">
                      <span className="font-medium capitalize">
                        {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                      </span>
                      <span className={enabled ? 'text-success' : 'text-muted-foreground'}>
                        {enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alert Thresholds</CardTitle>
                <CardDescription>Current monitoring alert configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Error Rate Threshold:</span>
                    <span>{(configManager.getAlertsConfig().errorThreshold * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Performance Threshold:</span>
                    <span>{configManager.getAlertsConfig().performanceThreshold}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Uptime Threshold:</span>
                    <span>{(configManager.getAlertsConfig().uptimeThreshold * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Sampling</CardTitle>
                <CardDescription>Monitoring sampling rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Sample Rate:</span>
                    <span>{(configManager.getMonitoringConfig().performance.sampleRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isProduction 
                      ? 'Production sampling reduces overhead while maintaining monitoring coverage'
                      : 'Development uses 100% sampling for complete visibility'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}