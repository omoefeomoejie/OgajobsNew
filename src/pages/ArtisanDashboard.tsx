import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  DollarSign, 
  Star, 
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp 
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Assignment {
  id: string;
  work_type: string;
  preferred_date: string;
  city: string;
  client_email: string;
  artisan_email: string;
  statcreated_atus: string;
}

export default function ArtisanDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    averageRating: 0
  });

  useEffect(() => {
    if (user?.email) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch recent assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('artisan_email', user?.email)
        .order('created_at', { ascending: false })
        .limit(5);

      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);

      // Fetch earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from('earnings')
        .select('artisan_earnings')
        .eq('artisan_id', user?.id);

      const totalEarnings = earningsData?.reduce((sum, earning) => 
        sum + (Number(earning.artisan_earnings) || 0), 0) || 0;

      // Fetch reviews for rating
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('artisan_reviews')
        .select('rating')
        .eq('artisan_id', user?.id);

      const averageRating = reviewsData?.length ? 
        reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length : 0;

      setStats({
        totalJobs: assignmentsData?.length || 0,
        completedJobs: 0, // Simplified for now
        totalEarnings,
        averageRating: Math.round(averageRating * 10) / 10
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (assignment: Assignment) => {
    return <Badge variant="secondary">New</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Artisan Dashboard</h1>
        <p className="text-muted-foreground">
          Track your jobs, earnings, and grow your business
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">All time assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Average rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedJobs}</div>
            <p className="text-xs text-muted-foreground">Jobs finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your artisan business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="h-16 flex-col">
              <Link to="/jobs">
                <Briefcase className="h-6 w-6 mb-2" />
                View Jobs
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-16 flex-col">
              <Link to="/profile">
                <Star className="h-6 w-6 mb-2" />
                Update Profile
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-16 flex-col">
              <Link to="/earnings">
                <TrendingUp className="h-6 w-6 mb-2" />
                View Earnings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Job Assignments</CardTitle>
          <CardDescription>Your latest work opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No assignments yet</p>
              <p className="text-sm text-muted-foreground">
                Complete your profile to start receiving job assignments
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{assignment.work_type}</h4>
                    <p className="text-sm text-muted-foreground">
                      {assignment.city} • {assignment.statcreated_atus || 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Client: {assignment.client_email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(assignment)}
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link to="/jobs">View All Jobs</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}