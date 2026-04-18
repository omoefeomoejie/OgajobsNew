import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Calendar,
  MapPin,
  User,
  Mail,
  Clock,
  CheckCircle,
  Plus,
  CreditCard,
  DollarSign,
  Briefcase,
  MoreVertical,
  Trash2,
  XCircle,
  MessageCircle,
  Star
} from 'lucide-react';
import { ReviewDialog } from '@/components/reviews/ReviewDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import PaymentForm from '@/components/payment/PaymentForm';
import EscrowManager from '@/components/payment/EscrowManager';

interface Booking {
  id: string;
  work_type: string;
  city: string;
  preferred_date: string;
  artisan_email: string;
  artisan_id: string;
  status: string;
  payment_status: string;
  description: string;
  urgency: string;
  budget: number;
  completion_date: string;
  created_at: string;
  updated_at: string;
}

export default function MyBookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (user?.email) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user?.email) return;
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_email', user.email)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Look up the escrow record for this booking
      const { data: escrow, error: escrowError } = await supabase
        .from('escrow_payments')
        .select('id')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (escrow?.id) {
        const { error: releaseError } = await supabase.functions.invoke('release-escrow', {
          body: { escrow_id: escrow.id }
        });
        if (releaseError) {
          console.error('Escrow release failed:', releaseError);
          toast({
            title: "Payment Release Failed",
            description: "Booking marked complete but escrow release failed. Contact support.",
            variant: "destructive"
          });
          return;
        }
      }

      toast({ title: "Success", description: "Booking completed and payment released to artisan!" });
      await fetchBookings();
    } catch (error) {
      toast({ title: "Error", description: "Failed to complete booking", variant: "destructive" });
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', bookingId)
        .eq('client_email', user?.email);

      if (error) throw error;

      toast({ title: 'Booking cancelled', description: 'Your booking request has been cancelled.' });
      fetchBookings();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setCancellingId(null);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    setDeletingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
        .eq('client_email', user?.email)
        .in('status', ['cancelled', 'completed']);

      if (error) throw error;

      toast({ title: 'Booking deleted', description: 'The booking has been removed.' });
      fetchBookings();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (booking: Booking) => {
    const statusMap = {
      'pending': { label: 'Pending', variant: 'secondary' as const },
      'accepted': { label: 'Artisan Assigned', variant: 'default' as const },
      'assigned': { label: 'Assigned', variant: 'default' as const },
      'paid': { label: 'Paid', variant: 'default' as const },
      'in_progress': { label: 'In Progress', variant: 'default' as const },
      'awaiting_approval': { label: 'Awaiting Your Approval', variant: 'outline' as const },
      'completed': { label: 'Completed', variant: 'default' as const },
      'cancelled': { label: 'Cancelled', variant: 'destructive' as const }
    };
    
    const status = statusMap[booking.status] || statusMap['pending'];
    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  const getPaymentBadge = (booking: Booking) => {
    const paymentMap = {
      'unpaid': { label: 'Unpaid', variant: 'outline' as const },
      'paid': { label: 'Paid', variant: 'default' as const },
      'refunded': { label: 'Refunded', variant: 'secondary' as const }
    };
    
    const payment = paymentMap[booking.payment_status] || paymentMap['unpaid'];
    return <Badge variant={payment.variant}>{payment.label}</Badge>;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-blue-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (booking: Booking) => {
    switch (booking.status) {
      case 'completed': return 'border-green-200 bg-green-50';
      case 'in_progress': return 'border-blue-200 bg-blue-50';
      case 'paid': return 'border-purple-200 bg-purple-50';
      case 'accepted': return 'border-yellow-200 bg-yellow-50';
      case 'assigned': return 'border-yellow-200 bg-yellow-50';
      case 'cancelled': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  // Filter bookings by status
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const assignedBookings = bookings.filter(b => ['accepted', 'assigned', 'paid', 'in_progress', 'awaiting_approval'].includes(b.status));
  const completedBookings = bookings.filter(b => b.status === 'completed');

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
          <div className="flex items-center gap-2">
            {getStatusBadge(booking)}
            {getPaymentBadge(booking)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded hover:bg-muted transition-colors">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {booking.status === 'pending' && (
                  <DropdownMenuItem
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={cancellingId === booking.id}
                    className="text-orange-600 focus:text-orange-600"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Request'}
                  </DropdownMenuItem>
                )}
                {(booking.status === 'cancelled' || booking.status === 'completed') && (
                  <DropdownMenuItem
                    onClick={() => handleDeleteBooking(booking.id)}
                    disabled={deletingId === booking.id}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deletingId === booking.id ? 'Deleting...' : 'Delete Booking'}
                  </DropdownMenuItem>
                )}
                {!['pending', 'cancelled', 'completed'].includes(booking.status || '') && (
                  <DropdownMenuItem disabled className="text-muted-foreground">
                    Cannot modify active booking
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardDescription className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {booking.city}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString() : 'Flexible'}
          </span>
          <span className={`flex items-center gap-1 font-medium ${getUrgencyColor(booking.urgency)}`}>
            <Clock className="h-4 w-4" />
            {booking.urgency
              ? booking.urgency.charAt(0).toUpperCase() + booking.urgency.slice(1)
              : 'Normal'} Priority
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {booking.description && (
            <div>
              <p className="text-sm text-muted-foreground">{booking.description}</p>
            </div>
          )}

          {booking.budget && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>Budget: ₦{booking.budget.toLocaleString()}</span>
            </div>
          )}

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

          {booking.completion_date && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Completed on {new Date(booking.completion_date).toLocaleDateString()}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Briefcase className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{booking.work_type} - Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className="mt-1">{getStatusBadge(booking)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Payment:</span>
                      <div className="mt-1">{getPaymentBadge(booking)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">City:</span>
                      <p className="font-medium">{booking.city}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <p className="font-medium">
                        {booking.preferred_date && booking.preferred_date !== '1970-01-01'
                          ? new Date(booking.preferred_date).toLocaleDateString()
                          : 'Flexible'}
                      </p>
                    </div>
                    {booking.budget && (
                      <div>
                        <span className="text-muted-foreground">Budget:</span>
                        <p className="font-medium">₦{booking.budget.toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Priority:</span>
                      <p className={`font-medium ${getUrgencyColor(booking.urgency)}`}>
                        {booking.urgency
                          ? booking.urgency.charAt(0).toUpperCase() + booking.urgency.slice(1)
                          : 'Normal'}
                      </p>
                    </div>
                  </div>
                  {booking.description && (
                    <div>
                      <span className="text-muted-foreground">Description:</span>
                      <p className="mt-1 text-sm">{booking.description}</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {['accepted', 'assigned'].includes(booking.status) && booking.payment_status === 'unpaid' && (
              <Button 
                size="sm" 
                onClick={() => {
                  setSelectedBooking(booking);
                  setShowPaymentDialog(true);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="h-3 w-3 mr-1" />
                Pay Now
              </Button>
            )}


            {(booking.status === 'accepted' || booking.status === 'paid' || booking.status === 'in_progress' || booking.status === 'awaiting_approval') && booking.artisan_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/messages?artisan=${booking.artisan_id}`)}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Message Artisan
              </Button>
            )}

            {/* awaiting_approval = artisan marked complete, client must approve and release escrow */}
            {booking.status === 'awaiting_approval' && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => markAsCompleted(booking.id)}
              >
                ✓ Approve & Release Payment
              </Button>
            )}

            {booking.status === 'in_progress' && (
              <Button
                size="sm"
                onClick={() => markAsCompleted(booking.id)}
                variant="outline"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark Complete
              </Button>
            )}

            {booking.status === 'completed' && booking.artisan_id && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReviewBooking(booking)}
              >
                <Star className="h-3 w-3 mr-1" />
                Leave a Review
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignedBookings.length}</div>
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
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
              <p className="text-muted-foreground mb-4">
                Book a verified artisan and your jobs will appear here.
              </p>
              <Button asChild>
                <Link to="/services">Find an Artisan</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingBookings.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({assignedBookings.length})</TabsTrigger>
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

            <TabsContent value="active" className="space-y-4">
              {assignedBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active bookings
                </div>
              ) : (
                assignedBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No completed bookings yet
                </div>
              ) : (
                completedBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Escrow Payments Section */}
        {user && (
          <div className="mt-8">
            <EscrowManager clientId={user.id} />
          </div>
        )}

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Pay for Service</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold">{selectedBooking.work_type}</h3>
                  <p className="text-sm text-muted-foreground">{selectedBooking.city}</p>
                  {selectedBooking.budget && (
                    <p className="text-sm">Budget: ₦{selectedBooking.budget.toLocaleString()}</p>
                  )}
                </div>
                <PaymentForm
                  bookingId={selectedBooking.id}
                  artisanId={selectedBooking.artisan_id}
                  transactionType="booking_payment"
                  defaultAmount={selectedBooking.budget || 50000}
                  onSuccess={() => {
                    setShowPaymentDialog(false);
                    fetchBookings();
                  }}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {reviewBooking && (
        <ReviewDialog
          isOpen={!!reviewBooking}
          onClose={() => setReviewBooking(null)}
          artisanId={reviewBooking.artisan_id}
          artisanName={reviewBooking.artisan_email || 'Artisan'}
          bookingId={reviewBooking.id}
          onReviewSubmitted={() => {
            setReviewBooking(null);
            fetchBookings();
          }}
        />
      )}
    </AppLayout>
  );
}