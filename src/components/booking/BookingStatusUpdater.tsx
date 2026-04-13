import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  MessageSquare,
  CreditCard,
  Play,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BookingStatusUpdaterProps {
  booking: {
    id: string;
    work_type: string;
    city: string;
    client_email: string;
    status: string;
    payment_status: string;
    preferred_date: string;
    description?: string;
    budget?: number;
  };
  onStatusUpdate?: () => void;
}

export default function BookingStatusUpdater({ booking, onStatusUpdate }: BookingStatusUpdaterProps) {
  const [loading, setLoading] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const { toast } = useToast();

  const updateBookingStatus = async (newStatus: string, notes?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-booking-status', {
        body: {
          booking_id: booking.id,
          status: newStatus,
          completion_confirmed: newStatus === 'completed',
          notes: notes
        }
      });

      if (error) throw new Error(error.message);

      toast({
        title: "Status Updated",
        description: `Booking status updated to ${newStatus}`,
      });

      onStatusUpdate?.();

      await supabase.functions.invoke('send-notification', {
        body: {
          userEmail: booking.client_email,
          type: 'email',
          template: 'booking_confirmed',
          data: {
            clientName: 'Client',
            artisanName: 'Your Artisan',
            serviceType: booking.work_type,
            preferredDate: booking.preferred_date || 'Flexible',
          }
        }
      });
      await supabase.functions.invoke('send-notification', {
        body: {
          userEmail: booking.client_email,
          type: 'in_app',
          template: 'booking_confirmed',
          data: {
            title: 'Booking Status Updated',
            message: `Your ${booking.work_type} booking status is now: ${newStatus}`,
            type: 'booking_update'
          }
        }
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update booking status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'paid': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'assigned': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAvailableActions = () => {
    const actions = [];

    switch (booking.status) {
      case 'assigned':
        if (booking.payment_status === 'paid') {
          actions.push({
            label: 'Start Work',
            status: 'in_progress',
            icon: Play,
            description: 'Mark this job as in progress'
          });
        }
        break;
      
      case 'paid':
        actions.push({
          label: 'Start Work',
          status: 'in_progress',
          icon: Play,
          description: 'Begin working on this job'
        });
        break;

      case 'in_progress':
        actions.push({
          label: 'Mark Complete',
          status: 'completed',
          icon: CheckCircle,
          description: 'Job has been completed successfully',
          requiresNotes: true
        });
        break;
    }

    return actions;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className={`border-2 ${getStatusColor(booking.status)}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{booking.work_type}</CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>📍 {booking.city}</span>
              <span>👤 {booking.client_email.split('@')[0]}</span>
              {booking.preferred_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(booking.preferred_date)}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge className={`${getStatusColor(booking.status)} border`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>
            <Badge variant={booking.payment_status === 'paid' ? 'default' : 'outline'}>
              {booking.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
            </Badge>
          </div>
        </div>
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
              <CreditCard className="h-4 w-4 text-green-600" />
              <span>Budget: ₦{booking.budget.toLocaleString()}</span>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {getAvailableActions().map((action) => (
              action.requiresNotes ? (
                <Dialog key={action.status}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      disabled={loading}
                      className="flex items-center gap-1"
                    >
                      <action.icon className="h-3 w-3" />
                      {action.label}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Complete Job</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Mark this job as completed and add any final notes for the client.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Completion Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Describe what was completed, any recommendations, etc..."
                          value={completionNotes}
                          onChange={(e) => setCompletionNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => updateBookingStatus(action.status, completionNotes)}
                        disabled={loading}
                      >
                        {loading ? 'Updating...' : 'Mark as Completed'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button 
                  key={action.status}
                  size="sm" 
                  onClick={() => updateBookingStatus(action.status)}
                  disabled={loading}
                  className="flex items-center gap-1"
                >
                  <action.icon className="h-3 w-3" />
                  {loading ? 'Updating...' : action.label}
                </Button>
              )
            ))}

            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Message Client
            </Button>
          </div>

          {booking.status === 'assigned' && booking.payment_status === 'unpaid' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-yellow-800">
                <Clock className="h-4 w-4" />
                <span>Waiting for client payment before work can begin</span>
              </div>
            </div>
          )}

          {booking.status === 'completed' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span>Job completed successfully! Payment will be released from escrow.</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}