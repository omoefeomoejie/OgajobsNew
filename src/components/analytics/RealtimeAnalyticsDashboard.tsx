import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  DollarSign,
  Clock,
  MapPin,
  Star,
  AlertCircle,
  Download,
  RefreshCw,
  Filter
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RealtimeMetrics {
  activeUsers: number;
  totalBookings: number;
  revenue: number;
  completionRate: number;
  averageRating: number;
  responseTime: number;
  topCities: Array<{ city: string; count: number; percentage: number }>;
  topServices: Array<{ service: string; count: number; revenue: number }>;
  hourlyBookings: Array<{ hour: string; bookings: number; revenue: number }>;
  dailyTrends: Array<{ date: string; bookings: number; revenue: number; users: number }>;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

export function RealtimeAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const { toast } = useToast();

  const fetchRealtimeMetrics = async () => {
    try {
      // Fetch real-time data from multiple sources
      const [bookingsData, usersData, ratingsData] = await Promise.all([
        supabase.from('bookings').select('*').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('profiles').select('*').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('artisan_reviews').select('*').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      if (bookingsData.error || usersData.error || ratingsData.error) {
        throw new Error('Failed to fetch analytics data');
      }

      // Process and aggregate data
      const bookings = bookingsData.data || [];
      const users = usersData.data || [];
      const reviews = ratingsData.data || [];

      // Calculate metrics
      const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.budget || 0), 0);
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

      // Group by cities
      const cityStats = bookings.reduce((acc, booking) => {
        const city = booking.city || 'Unknown';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by services
      const serviceStats = bookings.reduce((acc, booking) => {
        const service = booking.work_type || 'General';
        if (!acc[service]) {
          acc[service] = { count: 0, revenue: 0 };
        }
        acc[service].count += 1;
        acc[service].revenue += booking.budget || 0;
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>);

      // Hourly distribution
      const hourlyStats = bookings.reduce((acc, booking) => {
        const hour = new Date(booking.created_at).getHours();
        const hourStr = `${hour}:00`;
        if (!acc[hourStr]) {
          acc[hourStr] = { bookings: 0, revenue: 0 };
        }
        acc[hourStr].bookings += 1;
        acc[hourStr].revenue += booking.budget || 0;
        return acc;
      }, {} as Record<string, { bookings: number; revenue: number }>);

      const processedMetrics: RealtimeMetrics = {
        activeUsers: users.length,
        totalBookings: bookings.length,
        revenue: totalRevenue,
        completionRate: bookings.length > 0 ? (completedBookings.length / bookings.length) * 100 : 0,
        averageRating: avgRating,
        responseTime: 2.5, // Mock data - would come from performance metrics
        topCities: Object.entries(cityStats)
          .map(([city, count]) => ({
            city,
            count,
            percentage: (count / bookings.length) * 100
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        topServices: Object.entries(serviceStats)
          .map(([service, stats]) => ({
            service,
            count: stats.count,
            revenue: stats.revenue
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5),
        hourlyBookings: Object.entries(hourlyStats)
          .map(([hour, stats]) => ({
            hour,
            bookings: stats.bookings,
            revenue: stats.revenue
          }))
          .sort((a, b) => a.hour.localeCompare(b.hour)),
        dailyTrends: [] // Would be populated with historical data
      };

      setMetrics(processedMetrics);

      // Generate alerts based on metrics
      const newAlerts: Alert[] = [];
      if (processedMetrics.completionRate < 80) {
        newAlerts.push({
          id: `completion-${Date.now()}`,
          type: 'warning',
          title: 'Low Completion Rate',
          message: `Completion rate is ${processedMetrics.completionRate.toFixed(1)}%, below 80% threshold`,
          timestamp: new Date()
        });
      }
      if (processedMetrics.averageRating < 4.0) {
        newAlerts.push({
          id: `rating-${Date.now()}`,
          type: 'warning',
          title: 'Low Average Rating',
          message: `Average rating is ${processedMetrics.averageRating.toFixed(1)}, below 4.0 threshold`,
          timestamp: new Date()
        });
      }
      setAlerts(newAlerts);

    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch real-time analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtimeMetrics();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      // Subscribe to real-time changes instead of polling
      const channel = supabase
        .channel('analytics-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
          },
          () => {
            fetchRealtimeMetrics(); // Refresh when bookings change
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'artisans',
          },
          () => {
            fetchRealtimeMetrics(); // Refresh when artisans change
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [autoRefresh, refreshInterval]);

  const exportData = () => {
    if (!metrics) return;
    
    const dataToExport = {
      timestamp: new Date().toISOString(),
      metrics,
      alerts
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Real-time Analytics</h2>
          <p className="text-muted-foreground">Live business insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-center gap-3 p-3 border rounded-lg bg-orange-50 dark:bg-orange-950">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <div className="flex-1">
                <div className="font-medium">{alert.title}</div>
                <div className="text-sm text-muted-foreground">{alert.message}</div>
              </div>
              <Badge variant="outline" className="text-orange-600">
                {alert.type}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{metrics.activeUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{metrics.totalBookings}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +8%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">₦{metrics.revenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +15%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{metrics.completionRate.toFixed(1)}%</p>
              </div>
              <Star className="w-8 h-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <Progress value={metrics.completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hourly Booking Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.hourlyBookings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Hour</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.hourlyBookings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₦${value}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Cities by Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.topCities.map((city, index) => (
                    <div key={city.city} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{city.city}</div>
                          <div className="text-sm text-muted-foreground">{city.count} bookings</div>
                        </div>
                      </div>
                      <Badge variant="outline">{city.percentage.toFixed(1)}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.topCities}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="hsl(var(--primary))"
                      dataKey="count"
                      label={({ city, percentage }) => `${city} (${percentage.toFixed(1)}%)`}
                    >
                      {metrics.topCities.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Services by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={metrics.topServices} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="service" type="category" width={100} />
                  <Tooltip formatter={(value) => [`₦${value}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Average Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-500">{metrics.averageRating.toFixed(1)}</div>
                  <div className="flex justify-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(metrics.averageRating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Out of 5 stars</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-500">{metrics.responseTime}s</div>
                  <p className="text-sm text-muted-foreground mt-2">Average response time</p>
                  <div className="mt-4">
                    <Progress value={75} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">75% within target</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-500">{metrics.completionRate.toFixed(1)}%</div>
                  <p className="text-sm text-muted-foreground mt-2">Booking completion rate</p>
                  <div className="mt-4">
                    <Progress value={metrics.completionRate} className="h-2" />
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