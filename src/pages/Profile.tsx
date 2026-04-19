import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { UserProfile } from '@/components/profile/UserProfile';
import { WorkGallery } from '@/components/portfolio/WorkGallery';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Briefcase,
  Star,
  Shield,
  TrendingUp,
  Calendar,
  MapPin
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ArtisanStats {
  totalJobs: number;
  completedJobs: number;
  averageRating: number;
  totalReviews: number;
}

interface RecentActivity {
  id: string;
  type: 'completed';
  description: string;
  city: string;
  date: string;
}

export default function Profile() {
  const { profile, user } = useAuth();
  const isArtisan = profile?.role === 'artisan';
  const [stats, setStats] = useState<ArtisanStats>({
    totalJobs: 0,
    completedJobs: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    if (isArtisan && user?.id) {
      fetchArtisanStats();
      fetchRecentActivity();
    }
  }, [isArtisan, user]);

  const fetchArtisanStats = async () => {
    supabase
      .from('bookings')
      .select('status')
      .eq('artisan_id', user!.id)
      .then(({ data, error }) => {
        if (error) { console.error('Stats bookings error:', error); return; }
        const total = data?.length || 0;
        const completed = data?.filter(b => b.status === 'completed').length || 0;
        setStats(prev => ({ ...prev, totalJobs: total, completedJobs: completed }));
      });

    supabase
      .from('artisan_reviews')
      .select('rating')
      .eq('artisan_id', user!.id)
      .then(({ data, error }) => {
        if (error) { console.error('Stats reviews error:', error); return; }
        const total = data?.length || 0;
        const avg = total > 0
          ? data!.reduce((sum, r) => sum + Number(r.rating), 0) / total
          : 0;
        setStats(prev => ({ ...prev, totalReviews: total, averageRating: avg }));
      });
  };

  const fetchRecentActivity = async () => {
    supabase
      .from('bookings')
      .select('id, work_type, city, completion_date')
      .eq('artisan_id', user!.id)
      .eq('status', 'completed')
      .order('completion_date', { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (error) { console.error('Recent activity error:', error); return; }
        const activities: RecentActivity[] = (data || []).map(b => ({
          id: b.id,
          type: 'completed' as const,
          description: `Completed ${b.work_type || 'job'}${b.city ? ` in ${b.city}` : ''}`,
          city: b.city || '',
          date: b.completion_date || '',
        }));
        setRecentActivity(activities);
      });
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">
              {isArtisan 
                ? 'Manage your professional profile and showcase your work'
                : 'View and edit your profile information'
              }
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="w-full">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile Info
              </TabsTrigger>
              {isArtisan && (
                <>
                  <TabsTrigger value="portfolio" className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Portfolio
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Performance
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <UserProfile showAvatar={true} showFullForm={true} />
              
              {isArtisan && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Verification Status
                    </CardTitle>
                    <CardDescription>
                      Your current verification level and trust score
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Verification Level</p>
                        <p className="text-sm text-muted-foreground">
                          Complete more verifications to increase your trust score
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {profile?.verification_level || 'Unverified'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Trust Score</p>
                        <p className="text-sm text-muted-foreground">
                          Based on verifications, reviews, and performance
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {profile?.trust_score || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">out of 100</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {isArtisan && (
              <>
                <TabsContent value="portfolio" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        Work Portfolio
                      </CardTitle>
                      <CardDescription>
                        Showcase your best work to attract more clients
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <WorkGallery 
                        artisanId={user?.id} 
                        editable={true}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="stats" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalJobs}</div>
                        <p className="text-xs text-muted-foreground">{stats.completedJobs} completed</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">From {stats.totalReviews} reviews</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {stats.totalJobs > 0
                            ? `${Math.round((stats.completedJobs / stats.totalJobs) * 100)}%`
                            : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">Jobs completed</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>
                        Your recently completed jobs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {recentActivity.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No completed jobs yet.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                              <p className="text-sm">{activity.description}</p>
                              {activity.date && (
                                <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                                  {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}