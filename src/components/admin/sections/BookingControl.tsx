import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Eye, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface Booking {
  id: string;
  client_email: string;
  artisan_email: string | null;
  work_type: string;
  city: string;
  preferred_date: string | null;
  budget: number | null;
  status: string;
}

export function BookingControl() {
  const [bookings, setBookings] = useState<Booking[]>([]);
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
      let updateData: Partial<Booking> & { completion_date?: string } = {};
      
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
                    {bookings.slice(0, 20).map((booking) => (
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