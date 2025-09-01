import React, { memo, useMemo, useCallback } from 'react';
import { 
  Shield, 
  Users, 
  Briefcase, 
  DollarSign,
  AlertTriangle,
  Clock,
  Bell,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useControlStats } from '@/hooks/useAdminQueries';
import { AnalyticsDashboardSkeleton } from '@/components/ui/enhanced-skeleton';

interface MissionControlProps {
  setActiveSection: (section: string) => void;
}

// Memoized metric card component to prevent unnecessary re-renders
const MetricCard = memo(({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  colorClass, 
  onClick 
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ComponentType<any>;
  colorClass: string;
  onClick: () => void;
}) => (
  <Card 
    className={`${colorClass} cursor-pointer hover:shadow-md transition-shadow`}
    onClick={onClick}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs">{description}</p>
    </CardContent>
  </Card>
));

MetricCard.displayName = 'MetricCard';

// Memoized action card component
const ActionCard = memo(({ 
  title, 
  items, 
  onItemClick 
}: {
  title: string;
  items: Array<{ text: string; action: string; variant: 'destructive' | 'outline' }>;
  onItemClick: (action: string) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded">
          <span className="text-sm">{item.text}</span>
          <Button 
            size="sm" 
            variant={item.variant}
            onClick={() => onItemClick(item.action)}
          >
            {item.action === 'users' ? 'Review' : 'Handle'}
          </Button>
        </div>
      ))}
    </CardContent>
  </Card>
));

ActionCard.displayName = 'ActionCard';

export const MissionControlOptimized = memo(({ setActiveSection }: MissionControlProps) => {
  const { data: stats, isLoading, error } = useControlStats();

  // Memoized navigation handlers
  const handleNavigateToUsers = useCallback(() => setActiveSection('users'), [setActiveSection]);
  const handleNavigateToBookings = useCallback(() => setActiveSection('bookings'), [setActiveSection]);
  const handleNavigateToDisputes = useCallback(() => setActiveSection('disputes'), [setActiveSection]);
  const handleNavigateToFinance = useCallback(() => setActiveSection('finance'), [setActiveSection]);
  const handleNavigateToHealth = useCallback(() => setActiveSection('health'), [setActiveSection]);

  // Memoized metric cards data
  const metricCards = useMemo(() => [
    {
      title: "Verification Queue",
      value: stats?.pendingVerifications || 0,
      description: "Artisans waiting approval",
      icon: Clock,
      colorClass: "border-orange-200 bg-orange-50 text-orange-700",
      onClick: handleNavigateToUsers
    },
    {
      title: "Active Jobs",
      value: stats?.activeBookings || 0,
      description: "In progress now",
      icon: Activity,
      colorClass: "border-blue-200 bg-blue-50 text-blue-700",
      onClick: handleNavigateToBookings
    },
    {
      title: "Risk Alerts",
      value: stats?.flaggedUsers || 0,
      description: "Require attention",
      icon: AlertTriangle,
      colorClass: "border-red-200 bg-red-50 text-red-700",
      onClick: handleNavigateToDisputes
    },
    {
      title: "Escrow Held",
      value: `₦${(stats?.escrowAmount || 0).toLocaleString()}`,
      description: "Pending release",
      icon: DollarSign,
      colorClass: "border-green-200 bg-green-50 text-green-700",
      onClick: handleNavigateToFinance
    }
  ], [stats, handleNavigateToUsers, handleNavigateToBookings, handleNavigateToDisputes, handleNavigateToFinance]);

  // Memoized action items
  const urgentActions = useMemo(() => [
    { text: "2 artisans need verification", action: "users", variant: "destructive" as const },
    { text: "1 payment dispute escalated", action: "disputes", variant: "outline" as const }
  ], []);

  // Memoized today's pulse data
  const todaysPulse = useMemo(() => ({
    bookings: stats?.dailyBookings || 0,
    completionRate: stats?.completionRate || 0,
    responseTime: "1.2h avg"
  }), [stats]);

  // Loading state
  if (isLoading) {
    return <AnalyticsDashboardSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive">Failed to load mission control data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-destructive">🎯 Mission Control</h1>
          <p className="text-muted-foreground">Proactive operations command center</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="destructive" className="animate-pulse">
            <Bell className="w-3 h-3 mr-1" />
            3 Critical Alerts
          </Badge>
        </div>
      </div>

      {/* Critical Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card, index) => (
          <MetricCard key={index} {...card} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <ActionCard
          title="🚨 Urgent Actions"
          items={urgentActions}
          onItemClick={setActiveSection}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Today's Pulse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Bookings:</span>
              <span className="font-semibold">{todaysPulse.bookings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Completion Rate:</span>
              <span className="font-semibold text-green-600">{todaysPulse.completionRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Response Time:</span>
              <span className="font-semibold">{todaysPulse.responseTime}</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={handleNavigateToHealth}
        >
          <CardHeader>
            <CardTitle className="text-lg">⚡ System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">API Status:</span>
              <Badge variant="default">✅ Healthy</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Payments:</span>
              <Badge variant="default">✅ Online</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Notifications:</span>
              <Badge variant="secondary">⚠️ Degraded</Badge>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="w-full mt-2"
              onClick={(e) => {
                e.stopPropagation();
                setActiveSection('health');
              }}
            >
              View Details
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

MissionControlOptimized.displayName = 'MissionControlOptimized';