import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Target, 
  Users, 
  TrendingUp, 
  Settings, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Zap
} from 'lucide-react';

interface MatchingStats {
  totalBookings: number;
  autoMatched: number;
  manuallyAssigned: number;
  averageMatchingTime: number;
  successRate: number;
  pendingAssignments: number;
}

interface BookingAssignment {
  id: string;
  booking_id: string;
  artisan_id: string;
  status: string;
  assigned_at: string;
  assignment_type: string;
  response_deadline: string | null;
  artisan_response_at: string | null;
  assigned_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  bookings?: {
    work_type: string;
    city: string;
    budget: number;
    client_email: string;
  };
  artisans?: {
    full_name: string;
    email: string;
    category: string;
  };
}

interface MatchingAlgorithmSettings {
  distanceWeight: number;
  ratingWeight: number;
  categoryWeight: number;
  availabilityWeight: number;
  priceWeight: number;
  workloadWeight: number;
  autoAssignEnabled: boolean;
  maxAssignmentsPerBooking: number;
  responseTimeoutHours: number;
}

export const MatchingDashboard: React.FC = () => {
  const [stats, setStats] = useState<MatchingStats>({
    totalBookings: 0,
    autoMatched: 0,
    manuallyAssigned: 0,
    averageMatchingTime: 0,
    successRate: 0,
    pendingAssignments: 0
  });
  const [assignments, setAssignments] = useState<BookingAssignment[]>([]);
  const [settings, setSettings] = useState<MatchingAlgorithmSettings>({
    distanceWeight: 25,
    ratingWeight: 20,
    categoryWeight: 20,
    availabilityWeight: 15,
    priceWeight: 10,
    workloadWeight: 10,
    autoAssignEnabled: true,
    maxAssignmentsPerBooking: 3,
    responseTimeoutHours: 24
  });
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMatchingData();
    loadAlgorithmSettings();
  }, []);

  const fetchMatchingData = async () => {
    try {
      // Fetch matching statistics
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, status, created_at');

      if (bookingsError) throw bookingsError;

      // Fetch booking assignments with related data
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('booking_assignments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (assignmentsError) throw assignmentsError;

      // Fetch matching scores for performance analysis
      const { data: scoresData, error: scoresError } = await supabase
        .from('matching_scores')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (scoresError) throw scoresError;

      // Calculate statistics
      const totalBookings = bookingsData?.length || 0;
      const autoMatched = assignmentsData?.filter(a => a.assignment_type === 'auto_matched').length || 0;
      const manuallyAssigned = assignmentsData?.filter(a => a.assignment_type === 'manual').length || 0;
      const pendingAssignments = assignmentsData?.filter(a => a.status === 'pending').length || 0;

      // Calculate average matching time: time from booking creation to assignment
      const matchingTimes = (assignmentsData || []).map((a: any) => {
        const booking = (bookingsData || []).find((b: any) => b.id === a.booking_id);
        if (!booking) return null;
        const ms = new Date(a.created_at).getTime() - new Date(booking.created_at).getTime();
        return ms > 0 ? ms / 3600000 : null;
      }).filter((t): t is number => t !== null);
      const averageMatchingTime = matchingTimes.length > 0
        ? matchingTimes.reduce((sum, t) => sum + t, 0) / matchingTimes.length
        : 0;

      // Calculate success rate
      const completedAssignments = assignmentsData?.filter(a => a.status === 'accepted').length || 0;
      const successRate = assignmentsData?.length ? (completedAssignments / assignmentsData.length) * 100 : 0;

      setStats({
        totalBookings,
        autoMatched,
        manuallyAssigned,
        averageMatchingTime,
        successRate,
        pendingAssignments
      });

      setAssignments(assignmentsData || []);

    } catch (error) {
      console.error('Error fetching matching data:', error);
      toast({
        title: "Error",
        description: "Failed to load matching data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAlgorithmSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('key, value')
        .like('key', 'matching_%');

      if (error) throw error;

      // Convert settings data to object
      const settingsMap = (data || []).reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);

      // Update settings state with loaded values
      setSettings(prev => ({
        ...prev,
        distanceWeight: parseInt(settingsMap['matching_distance_weight']) || prev.distanceWeight,
        ratingWeight: parseInt(settingsMap['matching_rating_weight']) || prev.ratingWeight,
        categoryWeight: parseInt(settingsMap['matching_category_weight']) || prev.categoryWeight,
        availabilityWeight: parseInt(settingsMap['matching_availability_weight']) || prev.availabilityWeight,
        priceWeight: parseInt(settingsMap['matching_price_weight']) || prev.priceWeight,
        workloadWeight: parseInt(settingsMap['matching_workload_weight']) || prev.workloadWeight,
        autoAssignEnabled: settingsMap['matching_auto_assign_enabled'] === 'true',
        maxAssignmentsPerBooking: parseInt(settingsMap['matching_max_assignments']) || prev.maxAssignmentsPerBooking,
        responseTimeoutHours: parseInt(settingsMap['matching_response_timeout_hours']) || prev.responseTimeoutHours
      }));

    } catch (error) {
      console.error('Error loading algorithm settings:', error);
    }
  };

  const saveAlgorithmSettings = async () => {
    try {
      const settingsToSave = [
        { key: 'matching_distance_weight', value: settings.distanceWeight.toString() },
        { key: 'matching_rating_weight', value: settings.ratingWeight.toString() },
        { key: 'matching_category_weight', value: settings.categoryWeight.toString() },
        { key: 'matching_availability_weight', value: settings.availabilityWeight.toString() },
        { key: 'matching_price_weight', value: settings.priceWeight.toString() },
        { key: 'matching_workload_weight', value: settings.workloadWeight.toString() },
        { key: 'matching_auto_assign_enabled', value: settings.autoAssignEnabled.toString() },
        { key: 'matching_max_assignments', value: settings.maxAssignmentsPerBooking.toString() },
        { key: 'matching_response_timeout_hours', value: settings.responseTimeoutHours.toString() }
      ];

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('platform_settings')
          .upsert({
            key: setting.key,
            value: setting.value,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Algorithm settings saved successfully"
      });

      setSettingsOpen(false);

    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    }
  };

  const triggerAutoMatching = async (bookingId?: string) => {
    try {
      let { error } = await supabase.rpc('auto_assign_artisans', {
        booking_id_param: bookingId,
        max_assignments: settings.maxAssignmentsPerBooking
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: bookingId ? "Auto-matching triggered for booking" : "Auto-matching triggered for all pending bookings"
      });

      fetchMatchingData();

      // Notify all newly assigned artisans
      try {
        const { data: assignments } = await supabase
          .from('booking_assignments')
          .select('artisan_id, artisans(full_name, email), bookings(work_type, city, budget)')
          .eq('booking_id', bookingId)
          .eq('assignment_type', 'auto_matched');

        if (assignments && assignments.length > 0) {
          await Promise.all(assignments.map(async (assignment: any) => {
            const artisanEmail = assignment.artisans?.email;
            if (artisanEmail) {
              await supabase.functions.invoke('send-notification', {
                body: {
                  userEmail: artisanEmail,
                  type: 'in_app',
                  template: 'booking_assigned',
                  data: {
                    title: 'New Job Request',
                    message: `A new ${assignment.bookings?.work_type} job is available in ${assignment.bookings?.city}`,
                    type: 'booking_request',
                  },
                },
              });
            }
          }));
        }
      } catch (notifyError) {
        console.error('Failed to notify artisans after manual match:', notifyError);
      }

    } catch (error) {
      console.error('Error triggering auto-matching:', error);
      toast({
        title: "Error",
        description: "Failed to trigger auto-matching",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "default" as const, icon: Clock, color: "text-orange-600" },
      accepted: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      declined: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
      expired: { variant: "outline" as const, icon: Clock, color: "text-gray-600" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Matching Algorithm Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => fetchMatchingData()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Matching Algorithm Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Distance Weight ({settings.distanceWeight}%)</Label>
                    <Slider
                      value={[settings.distanceWeight]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, distanceWeight: value }))}
                      max={50}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rating Weight ({settings.ratingWeight}%)</Label>
                    <Slider
                      value={[settings.ratingWeight]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, ratingWeight: value }))}
                      max={50}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category Weight ({settings.categoryWeight}%)</Label>
                    <Slider
                      value={[settings.categoryWeight]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, categoryWeight: value }))}
                      max={50}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Availability Weight ({settings.availabilityWeight}%)</Label>
                    <Slider
                      value={[settings.availabilityWeight]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, availabilityWeight: value }))}
                      max={50}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price Weight ({settings.priceWeight}%)</Label>
                    <Slider
                      value={[settings.priceWeight]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, priceWeight: value }))}
                      max={50}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Workload Weight ({settings.workloadWeight}%)</Label>
                    <Slider
                      value={[settings.workloadWeight]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, workloadWeight: value }))}
                      max={50}
                      step={5}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Auto-assign Enabled</Label>
                    <Switch
                      checked={settings.autoAssignEnabled}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoAssignEnabled: checked }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Assignments per Booking</Label>
                    <Input
                      type="number"
                      value={settings.maxAssignmentsPerBooking}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxAssignmentsPerBooking: parseInt(e.target.value) }))}
                      min={1}
                      max={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Response Timeout (hours)</Label>
                    <Input
                      type="number"
                      value={settings.responseTimeoutHours}
                      onChange={(e) => setSettings(prev => ({ ...prev, responseTimeoutHours: parseInt(e.target.value) }))}
                      min={1}
                      max={168}
                    />
                  </div>
                </div>

                <Button onClick={saveAlgorithmSettings} className="w-full">
                  Save Settings
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => triggerAutoMatching()}>
            <Zap className="h-4 w-4 mr-2" />
            Run Auto-Match
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Matched</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.autoMatched}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalBookings > 0 ? `${((stats.autoMatched / stats.totalBookings) * 100).toFixed(1)}%` : '0%'} automation rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Avg. matching time: {stats.averageMatchingTime}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Artisan</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{assignment.bookings?.work_type || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">
                        {assignment.bookings?.city} • ₦{assignment.bookings?.budget?.toLocaleString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{assignment.artisans?.full_name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{assignment.artisans?.category}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      N/A
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                  <TableCell>
                    <Badge variant={assignment.assignment_type === 'auto_matched' ? 'default' : 'secondary'}>
                      {assignment.assignment_type === 'auto_matched' ? 'Auto' : 'Manual'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(assignment.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => triggerAutoMatching(assignment.booking_id)}
                      disabled={assignment.status !== 'pending'}
                    >
                      Re-match
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};