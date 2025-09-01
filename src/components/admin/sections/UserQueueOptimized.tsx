import React, { memo, useMemo, useCallback } from 'react';
import { CheckCircle, XCircle, Eye, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useArtisans, useUpdateArtisan } from '@/hooks/useAdminQueries';
import { TableSkeleton } from '@/components/ui/enhanced-skeleton';

interface ArtisanUser {
  id: string;
  full_name: string | null;
  email: string;
  skill: string | null;
  city: string | null;
  created_at: string;
  suspended: boolean;
}

// Memoized user row component to prevent unnecessary re-renders
const UserTableRow = memo(({ 
  user, 
  onApprove, 
  onReject, 
  isUpdating 
}: {
  user: ArtisanUser;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isUpdating: boolean;
}) => {
  const handleApprove = useCallback(() => onApprove(user.id), [onApprove, user.id]);
  const handleReject = useCallback(() => onReject(user.id), [onReject, user.id]);

  const formattedDate = useMemo(() => 
    user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
    [user.created_at]
  );

  return (
    <TableRow key={user.id}>
      <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>{user.skill || 'N/A'}</TableCell>
      <TableCell>{user.city || 'N/A'}</TableCell>
      <TableCell>{formattedDate}</TableCell>
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
            onClick={handleApprove}
            disabled={user.suspended || isUpdating}
            title="Approve Artisan"
          >
            <CheckCircle className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleReject}
            disabled={user.suspended || isUpdating}
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
  );
});

UserTableRow.displayName = 'UserTableRow';

// Memoized table component
const UsersTable = memo(({ 
  users, 
  onApprove, 
  onReject, 
  isUpdating 
}: {
  users: ArtisanUser[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isUpdating: boolean;
}) => (
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
      {users.slice(0, 10).map((user) => (
        <UserTableRow
          key={user.id}
          user={user}
          onApprove={onApprove}
          onReject={onReject}
          isUpdating={isUpdating}
        />
      ))}
    </TableBody>
  </Table>
));

UsersTable.displayName = 'UsersTable';

export const UserQueueOptimized = memo(() => {
  const { data: users = [], isLoading, error } = useArtisans();
  const updateArtisan = useUpdateArtisan();

  // Memoized handlers to prevent recreation on every render
  const handleApprove = useCallback((userId: string) => {
    updateArtisan.mutate({ userId, action: 'approve' });
  }, [updateArtisan]);

  const handleReject = useCallback((userId: string) => {
    updateArtisan.mutate({ userId, action: 'reject' });
  }, [updateArtisan]);

  // Memoized filtered users to prevent recalculation
  const filteredUsers = useMemo(() => ({
    pending: users.filter(user => !user.suspended),
    active: users.filter(user => !user.suspended),
    suspended: users.filter(user => user.suspended)
  }), [users]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">👥 User Queue</h1>
        </div>
        <div className="space-y-4">
          <TableSkeleton rows={10} />
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
            <p className="text-destructive">Failed to load users data</p>
          </div>
        </div>
      </div>
    );
  }

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
          <TabsTrigger value="pending">
            Pending Verification ({filteredUsers.pending.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active Users ({filteredUsers.active.length})
          </TabsTrigger>
          <TabsTrigger value="suspended">
            Suspended ({filteredUsers.suspended.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Artisan Verification Queue</CardTitle>
              <CardDescription>Review and approve new artisan applications</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTable
                users={filteredUsers.pending}
                onApprove={handleApprove}
                onReject={handleReject}
                isUpdating={updateArtisan.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
              <CardDescription>Currently approved and active artisans</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTable
                users={filteredUsers.active}
                onApprove={handleApprove}
                onReject={handleReject}
                isUpdating={updateArtisan.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suspended">
          <Card>
            <CardHeader>
              <CardTitle>Suspended Users</CardTitle>
              <CardDescription>Artisans that have been suspended</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTable
                users={filteredUsers.suspended}
                onApprove={handleApprove}
                onReject={handleReject}
                isUpdating={updateArtisan.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

UserQueueOptimized.displayName = 'UserQueueOptimized';