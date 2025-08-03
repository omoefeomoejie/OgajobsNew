import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: string;
  client_email: string;
  rating: number;
  review: string | null;
  created_at: string;
}

interface ReviewsListProps {
  artisanId: string;
  showHeader?: boolean;
  limit?: number;
}

export function ReviewsList({ artisanId, showHeader = true, limit }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    }
  });

  useEffect(() => {
    fetchReviews();
  }, [artisanId, limit]);

  const fetchReviews = async () => {
    try {
      let query = supabase
        .from('artisan_reviews')
        .select('*')
        .eq('artisan_id', artisanId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      setReviews(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reviewsData: Review[]) => {
    if (reviewsData.length === 0) {
      setStats({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
      return;
    }

    const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviewsData.length;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsData.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });

    setStats({
      averageRating,
      totalReviews: reviewsData.length,
      ratingDistribution: distribution
    });
  };

  const renderStars = (rating: number, size = 'sm') => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="h-24 bg-muted rounded animate-pulse"></div>
        )}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {showHeader && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              Reviews & Ratings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {stats.averageRating.toFixed(1)}
                </div>
                {renderStars(Math.round(stats.averageRating), 'lg')}
                <p className="text-sm text-muted-foreground mt-2">
                  Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-8">{rating}</span>
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{
                          width: `${stats.totalReviews > 0 
                            ? (stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100 
                            : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">
                      {stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Reviews */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
              <p className="text-muted-foreground">
                This artisan hasn't received any reviews yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {review.client_email.split('@')[0]}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          Verified Client
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-sm font-medium">
                        {review.rating}.0
                      </span>
                    </div>

                    {review.review && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.review}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More Button */}
      {limit && reviews.length === limit && (
        <div className="text-center">
          <button 
            className="text-primary hover:underline text-sm"
            onClick={() => window.location.href = `/artisan/${artisanId}/reviews`}
          >
            View all reviews
          </button>
        </div>
      )}
    </div>
  );
}