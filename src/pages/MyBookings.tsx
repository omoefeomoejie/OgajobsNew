import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Booking {
  id: string;
  work_type: string;
  city: string;
  preferred_date: string;
  artisan_email: string;
  created_at: string;
}

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_email', user?.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (booking: Booking) => {
    if (booking.artisan_email) {
      return <Badge variant="default">Assigned</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getStatusColor = (booking: Booking) => {
    if (booking.artisan_email) return 'border-green-200 bg-green-50';
    return 'border-yellow-200 bg-yellow-50';
  };

  // Filter bookings by status
  const pendingBookings = bookings.filter(b => !b.artisan_email);
  const assignedBookings = bookings.filter(b => b.artisan_email);
  const completedBookings: Booking[] = []; // Simplified for now

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className={`transition-all hover:shadow-md ${getStatusColor(booking)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{booking.work_type}</CardTitle>
          {getStatusBadge(booking)}
        </div>
        <CardDescription className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {booking.city}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString() : 'Flexible'}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {booking.artisan_email ? (
            <div className="p-3 bg-white rounded-lg border">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                Assigned Artisan
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  {booking.artisan_email}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Waiting for artisan assignment...
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              View Details
            </Button>
            {booking.artisan_email && (
              <Button size="sm" className="flex-1">
                Contact Artisan
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Bookings</h1>
            <p className="text-muted-foreground">
              Track your service requests and manage ongoing jobs
            </p>
          </div>
          <Button asChild>
            <Link to="/book">
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingBookings.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedBookings.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by requesting your first service from our skilled artisans
              </p>
              <Button asChild>
                <Link to="/services">Browse Artisans</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingBookings.length})</TabsTrigger>
              <TabsTrigger value="assigned">Assigned ({assignedBookings.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedBookings.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {pendingBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending bookings
                </div>
              ) : (
                pendingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>

            <TabsContent value="assigned" className="space-y-4">
              {assignedBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No assigned bookings
                </div>
              ) : (
                assignedBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                No completed bookings yet
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}