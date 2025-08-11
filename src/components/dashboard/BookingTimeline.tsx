import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  DollarSign,
  Calendar,
  User,
  MessageSquare,
  CreditCard,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Booking {
  id: string;
  work_type: string;
  city: string;
  budget: number;
  preferred_date: string;
  status: string;
  artisan_id: string;
  artisan_email: string;
  description: string;
  created_at: string;
  completion_date?: string;
  payment_status: string;
}

export function BookingTimeline() {
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
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_email', user?.email)
        .order('created_at', { ascending: false })
        .limit(10);

      setBookings(bookingsData || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
      in_progress: { label: 'In Progress', variant: 'default' as const, icon: AlertCircle },
      awaiting_payment: { label: 'Awaiting Payment', variant: 'outline' as const, icon: CreditCard },
      completed: { label: 'Completed', variant: 'default' as const, icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getDeadlineStatus = (preferredDate: string, status: string) => {
    if (status === 'completed') return null;
    
    const deadline = new Date(preferredDate);
    const now = new Date();
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return <span className="text-xs text-red-500">Overdue</span>;
    } else if (daysLeft === 0) {
      return <span className="text-xs text-orange-500">Due today</span>;
    } else if (daysLeft <= 2) {
      return <span className="text-xs text-yellow-500">Due in {daysLeft} day{daysLeft > 1 ? 's' : ''}</span>;
    }
    return null;
  };

  const handleAction = (action: string, bookingId: string) => {
    console.log(`${action} for booking ${bookingId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Active Bookings ({bookings.length})
        </CardTitle>
        <CardDescription>Track your service requests</CardDescription>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No bookings yet</p>
            <Button>Book Your First Service</Button>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="p-4 border rounded-lg space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{booking.work_type}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {booking.city}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ₦{booking.budget?.toLocaleString()}
                        </div>
                        {booking.artisan_email && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {booking.artisan_email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      {getStatusBadge(booking.status)}
                      {getDeadlineStatus(booking.preferred_date, booking.status)}
                    </div>
                  </div>

                  {/* Timeline Date */}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Preferred Date: {new Date(booking.preferred_date).toLocaleDateString()}</span>
                    {booking.completion_date && (
                      <>
                        <Separator orientation="vertical" className="h-4" />
                        <span>Completed: {new Date(booking.completion_date).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  {booking.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {booking.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    {booking.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAction('message', booking.id)}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Message Artisan
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAction('cancel', booking.id)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    
                    {booking.status === 'in_progress' && (
                      <>
                        <Button 
                          size="sm"
                          onClick={() => handleAction('approve', booking.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve Work
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAction('request_change', booking.id)}
                        >
                          Request Change
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAction('message', booking.id)}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Message
                        </Button>
                      </>
                    )}
                    
                    {booking.status === 'awaiting_payment' && (
                      <Button 
                        size="sm"
                        onClick={() => handleAction('release_payment', booking.id)}
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Release Payment
                      </Button>
                    )}
                    
                    {booking.status === 'completed' && (
                      <>
                        <Button 
                          size="sm"
                          onClick={() => handleAction('review', booking.id)}
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Leave Review
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAction('rehire', booking.id)}
                        >
                          Rehire Artisan
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}