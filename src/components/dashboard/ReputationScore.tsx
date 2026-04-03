import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Award, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReputationData {
  rating: number;
  totalReviews: number;
  onTimeRate: number;
  completionRate: number;
  trustScore: number;
  level: string;
  badge: string;
}

export function ReputationScore() {
  const { user } = useAuth();
  const [reputation, setReputation] = useState<ReputationData>({
    rating: 0,
    totalReviews: 0,
    onTimeRate: 0,
    completionRate: 0,
    trustScore: 0,
    level: 'Bronze',
    badge: 'New Artisan'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchReputationData();
    }
  }, [user]);

  const fetchReputationData = async () => {
    try {
      // Fetch reviews — compute trust score from actual review data
      const { data: reviews, error: reviewsError } = await supabase
        .from('artisan_reviews')
        .select('rating')
        .eq('artisan_id', user?.id);

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
      }

      // Fetch completed bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('status, completion_date, preferred_date')
        .eq('artisan_id', user?.id);

      const totalReviews = reviews?.length || 0;
      const averageRating = totalReviews > 0
        ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

      // Compute trust score from reviews (rating 1-5 maps to 0-100)
      const computedScore = Math.round(averageRating * 20);

      const completedJobs = bookings?.filter(b => b.status === 'completed') || [];
      const completionRate = bookings?.length ? (completedJobs.length / bookings.length) * 100 : 0;

      // Calculate on-time rate based on completion_date vs preferred_date
      const onTimeJobs = completedJobs.filter(job => {
        if (!job.completion_date || !job.preferred_date) return false;
        return new Date(job.completion_date) <= new Date(job.preferred_date);
      });
      const onTimeRate = completedJobs.length ? (onTimeJobs.length / completedJobs.length) * 100 : 0;

      // Determine level and badge from computed trust score and review count
      let level = 'Bronze';
      let badge = 'New Artisan';

      if (computedScore >= 80) {
        level = 'Pro';
        badge = 'Verified Pro';
      } else if (computedScore >= 60) {
        level = 'Gold';
        badge = 'Trusted Expert';
      } else if (computedScore >= 40) {
        level = 'Silver';
        badge = 'Skilled Artisan';
      } else if (totalReviews >= 5) {
        level = 'Bronze';
        badge = 'Established';
      }

      setReputation({
        rating: Number(averageRating.toFixed(1)),
        totalReviews,
        onTimeRate: Number(onTimeRate.toFixed(0)),
        completionRate: Number(completionRate.toFixed(0)),
        trustScore: computedScore,
        level,
        badge
      });
    } catch (error) {
      console.error('Error fetching reputation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    const colors = {
      Bronze: 'text-amber-600 bg-amber-50 border-amber-200',
      Silver: 'text-gray-600 bg-gray-50 border-gray-200',
      Gold: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      Pro: 'text-purple-600 bg-purple-50 border-purple-200'
    };
    return colors[level as keyof typeof colors] || colors.Bronze;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reputation Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Reputation Score
        </CardTitle>
        <CardDescription>Your professional standing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Level Badge */}
        <div className="text-center space-y-2">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getLevelColor(reputation.level)}`}>
            <Award className="h-4 w-4" />
            <span className="font-medium">{reputation.level} Level</span>
          </div>
          <p className="text-sm text-muted-foreground">{reputation.badge}</p>
        </div>

        {/* Trust Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Trust Score</span>
            <span className="text-sm font-bold">{reputation.trustScore}/100</span>
          </div>
          <Progress value={reputation.trustScore} className="h-2" />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Rating</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">{reputation.rating}</span>
                <span className="text-sm text-muted-foreground">/5.0</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {reputation.totalReviews} reviews
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">On-Time</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">{reputation.onTimeRate}</span>
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">delivery rate</p>
            </div>
          </div>

          <div className="space-y-2 col-span-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Completion Rate</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">{reputation.completionRate}%</span>
                <span className="text-sm text-muted-foreground">of jobs completed</span>
              </div>
              <Progress value={reputation.completionRate} className="h-2" />
            </div>
          </div>
        </div>

        {/* Next Level Progress */}
        {reputation.level !== 'Pro' && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Next Level Progress</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Complete 5 more jobs and maintain 4.5+ rating to reach {
                reputation.level === 'Bronze' ? 'Silver' :
                reputation.level === 'Silver' ? 'Gold' : 'Pro'
              } level
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}