import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

interface MissionControlProps {
  setActiveSection: (section: string) => void;
}

interface ControlStats {
  pendingVerifications: number;
  activeBookings: number;
  flaggedUsers: number;
  escrowAmount: number;
  dailyBookings: number;
  completionRate: number;
}

export function MissionControl({ setActiveSection }: MissionControlProps) {
  const [stats, setStats] = useState<ControlStats>({
    pendingVerifications: 0,
    activeBookings: 0,
    flaggedUsers: 0,
    escrowAmount: 0,
    dailyBookings: 0,
    completionRate: 0
  });

  useEffect(() => {
    fetchControlStats();
  }, []);

  const fetchControlStats = async () => {
    try {
      // Fetch critical metrics
      const [artisansRes, bookingsRes, paymentsRes] = await Promise.all([
        supabase.from('artisans').select('*', { count: 'exact' }),
        supabase.from('bookings').select('*', { count: 'exact' }),
        supabase.from('payment_transactions').select('amount, escrow_status')
      ]);

      const pendingArtisans = artisansRes.data?.filter(a => !a.suspended).length || 0;
      const activeBookings = bookingsRes.data?.filter(b => b.status === 'in_progress').length || 0;
      const escrowTotal = paymentsRes.data?.filter(p => p.escrow_status === 'held')
        .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      setStats({
        pendingVerifications: pendingArtisans,
        activeBookings,
        flaggedUsers: 2, // Mock data - implement flagging system
        escrowAmount: escrowTotal,
        dailyBookings: bookingsRes.count || 0,
        completionRate: 85 // Mock data - calculate from completed vs total
      });
    } catch (error) {
      console.error('Error fetching control stats:', error);
    }
  };

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
        <Card 
          className="border-orange-200 bg-orange-50 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveSection('users')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Queue</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{stats.pendingVerifications}</div>
            <p className="text-xs text-orange-600">Artisans waiting approval</p>
          </CardContent>
        </Card>
        
        <Card 
          className="border-blue-200 bg-blue-50 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveSection('bookings')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.activeBookings}</div>
            <p className="text-xs text-blue-600">In progress now</p>
          </CardContent>
        </Card>

        <Card 
          className="border-red-200 bg-red-50 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveSection('disputes')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.flaggedUsers}</div>
            <p className="text-xs text-red-600">Require attention</p>
          </CardContent>
        </Card>

        <Card 
          className="border-green-200 bg-green-50 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveSection('finance')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escrow Held</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">₦{stats.escrowAmount.toLocaleString()}</div>
            <p className="text-xs text-green-600">Pending release</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🚨 Urgent Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded">
              <span className="text-sm">2 artisans need verification</span>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => setActiveSection('users')}
              >
                Review
              </Button>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
              <span className="text-sm">1 payment dispute escalated</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setActiveSection('disputes')}
              >
                Handle
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Today's Pulse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Bookings:</span>
              <span className="font-semibold">{stats.dailyBookings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Completion Rate:</span>
              <span className="font-semibold text-green-600">{stats.completionRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Response Time:</span>
              <span className="font-semibold">1.2h avg</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveSection('health')}
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
}