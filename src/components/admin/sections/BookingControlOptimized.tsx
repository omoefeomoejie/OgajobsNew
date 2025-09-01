import React, { memo, useMemo, useCallback } from 'react';
import { CheckCircle, XCircle, Eye, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBookings, useUpdateBooking } from '@/hooks/useAdminQueries';
import { TableSkeleton } from '@/components/ui/enhanced-skeleton';

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

// Memoized status badge component
const StatusBadge = memo(({ status }: { status: string }) => {
  const badgeProps = useMemo(() => {
    switch (status) {
      case 'pending':
        return { variant: 'secondary' as const, text: 'Pending' };
      case 'approved':
        return { variant: 'default' as const, text: 'Approved' };
      case 'in_progress':
        return { variant: 'outline' as const, text: 'In Progress' };
      case 'completed':
        return { variant: 'default' as const, text: 'Completed' };
      case 'cancelled':
        return { variant: 'destructive' as const, text: 'Cancelled' };
      default:
        return { variant: 'secondary' as const, text: status };
    }
  }, [status]);

  return <Badge variant={badgeProps.variant}>{badgeProps.text}</Badge>;
});

StatusBadge.displayName = 'StatusBadge';

// Memoized booking row component
const BookingTableRow = memo(({ 
  booking, 
  onApprove, 
  onCancel, 
  onComplete,
  isUpdating 
}: {
  booking: Booking;
  onApprove: (id: string) => void;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
  isUpdating: boolean;
}) => {
  const handleApprove = useCallback(() => onApprove(booking.id), [onApprove, booking.id]);
  const handleCancel = useCallback(() => onCancel(booking.id), [onCancel, booking.id]);
  const handleComplete = useCallback(() => onComplete(booking.id), [onComplete, booking.id]);

  const formattedDate = useMemo(() => 
    booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString() : 'N/A',
    [booking.preferred_date]
  );

  const formattedBudget = useMemo(() =>
    booking.budget ? `₦${Number(booking.budget).toLocaleString()}` : 'N/A',
    [booking.budget]
  );

  const showApprove = booking.status === 'pending';
  const showCancel = booking.status !== 'cancelled' && booking.status !== 'completed';

  return (
    <TableRow key={booking.id}>
      <TableCell className="font-medium">{booking.client_email}</TableCell>
      <TableCell>{booking.artisan_email || 'Unassigned'}</TableCell>
      <TableCell>{booking.work_type}</TableCell>
      <TableCell>{booking.city}</TableCell>
      <TableCell>{formattedDate}</TableCell>
      <TableCell>{formattedBudget}</TableCell>
      <TableCell><StatusBadge status={booking.status} /></TableCell>
      <TableCell>
        <div className="flex gap-2">
          {showApprove && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleApprove}
              disabled={isUpdating}
              title="Approve Booking"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
          {showCancel && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleCancel}
              disabled={isUpdating}
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
  );
});

BookingTableRow.displayName = 'BookingTableRow';

// Memoized table component
const BookingsTable = memo(({ 
  bookings, 
  onApprove, 
  onCancel, 
  onComplete,
  isUpdating 
}: {
  bookings: Booking[];
  onApprove: (id: string) => void;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
  isUpdating: boolean;
}) => (
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
        <BookingTableRow
          key={booking.id}
          booking={booking}
          onApprove={onApprove}
          onCancel={onCancel}
          onComplete={onComplete}
          isUpdating={isUpdating}
        />
      ))}
    </TableBody>
  </Table>
));

BookingsTable.displayName = 'BookingsTable';

export const BookingControlOptimized = memo(() => {
  const { data: bookings = [], isLoading, error } = useBookings();
  const updateBooking = useUpdateBooking();

  // Memoized handlers
  const handleApprove = useCallback((bookingId: string) => {
    updateBooking.mutate({ bookingId, action: 'approve' });
  }, [updateBooking]);

  const handleCancel = useCallback((bookingId: string) => {
    updateBooking.mutate({ bookingId, action: 'cancel' });
  }, [updateBooking]);

  const handleComplete = useCallback((bookingId: string) => {
    updateBooking.mutate({ bookingId, action: 'complete' });
  }, [updateBooking]);

  // Memoized filtered bookings
  const filteredBookings = useMemo(() => ({
    all: bookings,
    pending: bookings.filter(booking => booking.status === 'pending'),
    active: bookings.filter(booking => 
      booking.status === 'in_progress' || booking.status === 'approved'
    ),
    completed: bookings.filter(booking => booking.status === 'completed')
  }), [bookings]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">📋 Booking Control Center</h1>
        </div>
        <div className="space-y-4">
          <TableSkeleton rows={15} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive">Failed to load bookings data</p>
          </div>
        </div>
      </div>
    );
  }

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
          <TabsTrigger value="all">
            All Bookings ({filteredBookings.all.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({filteredBookings.pending.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({filteredBookings.active.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({filteredBookings.completed.length})
          </TabsTrigger>
        </TabsList>
        
        {(['all', 'pending', 'active', 'completed'] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {tab === 'all' ? 'Booking Management' : 
                   tab === 'pending' ? 'Pending Bookings' :
                   tab === 'active' ? 'Active Bookings' :
                   'Completed Bookings'}
                </CardTitle>
                <CardDescription>
                  {tab === 'all' ? 'Review and manage all platform bookings' :
                   tab === 'pending' ? 'Bookings awaiting approval' :
                   tab === 'active' ? 'Currently active bookings' :
                   'Successfully completed bookings'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BookingsTable
                  bookings={filteredBookings[tab]}
                  onApprove={handleApprove}
                  onCancel={handleCancel}
                  onComplete={handleComplete}
                  isUpdating={updateBooking.isPending}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
});

BookingControlOptimized.displayName = 'BookingControlOptimized';