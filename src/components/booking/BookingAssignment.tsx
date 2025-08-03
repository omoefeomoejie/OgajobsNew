import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  User, 
  Mail, 
  AlertCircle,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AvailableBooking {
  id: string;
  work_type: string;
  city: string;
  preferred_date: string;
  description: string;
  urgency: string;
  budget: number;
  client_email: string;
  status: string;
  created_at: string;
}

interface BookingAssignmentProps {
  artisanId: string;
  artisanEmail: string;
}

export default function BookingAssignment({ artisanId, artisanEmail }: BookingAssignmentProps) {
  const [availableBookings, setAvailableBookings] = useState<AvailableBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<AvailableBooking | null>(null);
  const [proposalMessage, setProposalMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailableBookings();
  }, []);

  const fetchAvailableBookings = async () => {
    try {
      // Fetch bookings that are pending and don't have an assigned artisan
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'pending')
        .is('artisan_email', null)
        .is('artisan_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load available bookings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyForBooking = async (bookingId: string) => {
    setSubmitting(true);
    try {
      // Update the booking to assign this artisan
      const { error } = await supabase
        .from('bookings')
        .update({
          artisan_email: artisanEmail,
          artisan_id: artisanId,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('status', 'pending'); // Ensure it's still pending

      if (error) throw error;

      toast({
        title: "Success!",
        description: "You've been assigned to this booking. The client will be notified.",
      });

      // Refresh the list
      await fetchAvailableBookings();
      setSelectedBooking(null);
      setProposalMessage('');
    } catch (error) {
      console.error('Error applying for booking:', error);
      toast({
        title: "Error",
        description: "Failed to apply for booking. It may have been assigned to another artisan.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Available Bookings</h3>
        <Badge variant="secondary">{availableBookings.length} available</Badge>
      </div>

      {availableBookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">No bookings available</h3>
            <p className="text-muted-foreground">
              Check back later for new booking opportunities in your area.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {availableBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{booking.work_type}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {booking.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {booking.preferred_date ? formatDate(booking.preferred_date) : 'Flexible'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(booking.created_at).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge className={`${getUrgencyColor(booking.urgency)} border`}>
                    {booking.urgency?.charAt(0).toUpperCase() + booking.urgency?.slice(1)} Priority
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {booking.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">{booking.description}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {booking.budget && (
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          Budget: ₦{booking.budget.toLocaleString()}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        Client: {booking.client_email.split('@')[0]}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Booking Details</DialogTitle>
                          </DialogHeader>
                          {selectedBooking && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Service:</span>
                                  <p className="font-medium">{selectedBooking.work_type}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Location:</span>
                                  <p className="font-medium">{selectedBooking.city}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Date:</span>
                                  <p className="font-medium">
                                    {selectedBooking.preferred_date ? 
                                      formatDate(selectedBooking.preferred_date) : 'Flexible'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Priority:</span>
                                  <Badge className={`${getUrgencyColor(selectedBooking.urgency)} border text-xs`}>
                                    {selectedBooking.urgency?.charAt(0).toUpperCase() + selectedBooking.urgency?.slice(1)}
                                  </Badge>
                                </div>
                                {selectedBooking.budget && (
                                  <div className="col-span-2">
                                    <span className="text-muted-foreground">Budget:</span>
                                    <p className="font-medium text-green-600">₦{selectedBooking.budget.toLocaleString()}</p>
                                  </div>
                                )}
                              </div>
                              
                              {selectedBooking.description && (
                                <div>
                                  <span className="text-muted-foreground">Description:</span>
                                  <p className="mt-1 text-sm">{selectedBooking.description}</p>
                                </div>
                              )}

                              <div className="space-y-2">
                                <Label htmlFor="proposal">Your Message (Optional)</Label>
                                <Textarea
                                  id="proposal"
                                  placeholder="Introduce yourself and explain how you can help..."
                                  value={proposalMessage}
                                  onChange={(e) => setProposalMessage(e.target.value)}
                                  rows={3}
                                />
                              </div>

                              <Button 
                                className="w-full" 
                                onClick={() => applyForBooking(selectedBooking.id)}
                                disabled={submitting}
                              >
                                {submitting ? 'Applying...' : 'Apply for This Booking'}
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button 
                        size="sm" 
                        onClick={() => applyForBooking(booking.id)}
                        disabled={submitting}
                      >
                        {submitting ? 'Applying...' : 'Apply Now'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}