import React from 'react';
import { PerformanceMonitor } from '@/components/monitoring/PerformanceMonitor';
import { ErrorTracker } from '@/components/monitoring/ErrorTracker';
import { TestHelper } from '@/components/testing/TestHelper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Bug, TestTube } from 'lucide-react';

export default function MonitoringDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="w-6 h-6" />
        <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
      </div>
      
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Error Tracking</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance">
          <PerformanceMonitor showDetails={true} />
        </TabsContent>
        
        <TabsContent value="errors">
          <ErrorTracker />
        </TabsContent>
        
        <TabsContent value="testing">
          <TestHelper />
        </TabsContent>
      </Tabs>
    </div>
  );
}