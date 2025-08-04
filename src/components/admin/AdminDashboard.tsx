import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { FinancialReporting } from '@/components/admin/FinancialReporting';
import { AdvancedPerformanceMetrics } from '@/components/analytics/AdvancedPerformanceMetrics';
import { UserBehaviorAnalytics } from '@/components/analytics/UserBehaviorAnalytics';
import { SecurityDashboard } from './SecurityDashboard';
import { 
  Shield, 
  Users, 
  Briefcase, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Eye,
  Filter,
  Bell,
  Activity,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const adminMenuItems = [
  { title: "Mission Control", url: "#control", icon: Activity },
  { title: "User Queue", url: "#users", icon: Users },
  { title: "Booking Control", url: "#bookings", icon: Briefcase },
  { title: "Financial Hub", url: "#finance", icon: DollarSign },
  { title: "Analytics", url: "#analytics", icon: TrendingUp },
  { title: "Performance Metrics", url: "#performance", icon: Target },
  { title: "User Behavior", url: "#behavior", icon: BarChart3 },
  { title: "Trust & Safety", url: "#safety", icon: Shield },
  { title: "System Health", url: "#health", icon: Zap },
];

function AdminSidebar({ activeSection, setActiveSection }: { 
  activeSection: string; 
  setActiveSection: (section: string) => void; 
}) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Control</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => setActiveSection(item.url.replace('#', ''))}
                    className={activeSection === item.url.replace('#', '') ? "bg-destructive text-destructive-foreground font-medium" : "hover:bg-muted/50"}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

// Mission Control Overview
function MissionControl() {
  const [stats, setStats] = useState({
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
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Queue</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{stats.pendingVerifications}</div>
            <p className="text-xs text-orange-600">Artisans waiting approval</p>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.activeBookings}</div>
            <p className="text-xs text-blue-600">In progress now</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.flaggedUsers}</div>
            <p className="text-xs text-red-600">Require attention</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
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
              <Button size="sm" variant="destructive">Review</Button>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
              <span className="text-sm">1 payment dispute escalated</span>
              <Button size="sm" variant="outline">Handle</Button>
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

        <Card>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// User Queue Management
function UserQueue() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('artisans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('artisans')
        .update({ suspended: action === 'reject' })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: `User ${action}d successfully`,
        description: `The artisan has been ${action}d.`,
      });

      fetchPendingUsers();
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} user. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">👥 User Queue</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Badge variant="secondary">{users.length} Total Users</Badge>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending Verification</TabsTrigger>
          <TabsTrigger value="active">Active Users</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Artisan Verification Queue</CardTitle>
              <CardDescription>Review and approve new artisan applications</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Skill</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.slice(0, 10).map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.skill || 'N/A'}</TableCell>
                        <TableCell>{user.city || 'N/A'}</TableCell>
                        <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={user.suspended ? "destructive" : "default"}>
                            {user.suspended ? 'Suspended' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUserAction(user.id, 'approve')}
                              disabled={user.suspended}
                              title="Approve Artisan"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUserAction(user.id, 'reject')}
                              disabled={user.suspended}
                              title="Suspend Artisan"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" title="View Details">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                Active users management - Coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suspended">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                Suspended users review - Coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Booking Control Center
function BookingControl() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'approve' | 'cancel' | 'complete') => {
    try {
      let updateData: any = {};
      
      switch (action) {
        case 'approve':
          updateData = { status: 'approved' };
          break;
        case 'cancel':
          updateData = { status: 'cancelled' };
          break;
        case 'complete':
          updateData = { status: 'completed', completion_date: new Date().toISOString() };
          break;
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: `Booking ${action}d successfully`,
        description: `The booking has been ${action}d.`,
      });

      fetchBookings();
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} booking. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'in_progress':
        return <Badge variant="outline">In Progress</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📋 Booking Control Center</h1>
          <p className="text-muted-foreground">Real-time booking management and oversight</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter Status
          </Button>
          <Badge variant="secondary">{bookings.length} Total Bookings</Badge>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Management</CardTitle>
              <CardDescription>Review and manage all platform bookings</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading bookings...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Artisan</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.slice(0, 20).map((booking: any) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.client_email}</TableCell>
                        <TableCell>{booking.artisan_email || 'Unassigned'}</TableCell>
                        <TableCell>{booking.work_type}</TableCell>
                        <TableCell>{booking.city}</TableCell>
                        <TableCell>{booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{booking.budget ? `₦${Number(booking.budget).toLocaleString()}` : 'N/A'}</TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {booking.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBookingAction(booking.id, 'approve')}
                                title="Approve Booking"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleBookingAction(booking.id, 'cancel')}
                                title="Cancel Booking"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" title="View Details">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                Pending bookings filter - Coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                Active bookings filter - Coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                Completed bookings filter - Coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main Admin Dashboard Component
export function AdminDashboard() {
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState("control");

  const renderContent = () => {
    switch (activeSection) {
      case 'control':
        return <MissionControl />;
      case 'users':
        return <UserQueue />;
      case 'bookings':
        return <BookingControl />;
      case 'finance':
        return <FinancialReporting />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'performance':
        return <AdvancedPerformanceMetrics />;
      case 'behavior':
        return <UserBehaviorAnalytics />;
      case 'safety':
        return <SecurityDashboard />;
      case 'health':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold">⚡ System Health</h2>
            <p className="text-muted-foreground">Infrastructure monitoring - Coming soon</p>
          </div>
        );
      default:
        return <MissionControl />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between border-b px-6 bg-destructive/5">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <Badge variant="destructive">Admin Control</Badge>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium">Mission Control Active</span>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}