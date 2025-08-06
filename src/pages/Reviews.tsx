import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, User, MessageSquare, TrendingUp, Award } from 'lucide-react';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { ReviewDialog } from '@/components/reviews/ReviewDialog';
import { formatDistanceToNow } from 'date-fns';

interface ReviewData {
  id: string;
  artisan_id: string;
  client_email: string;
  rating: number;
  review: string | null;
  created_at: string;
  artisan?: {
    full_name: string;
    email: string;
    category: string;
    city: string;
    photo_url: string;
  };
}

interface ReceivedReview extends ReviewData {
  artisan: {
    full_name: string;
    email: string;
    category: string;
    city: string;
    photo_url: string;
  };
}

interface CompletedBooking {
  id: string;
  artisan_id: string;
  work_type: string;
  status: string;
  completion_date: string;
  artisan?: {
    full_name: string;
    email: string;
    photo_url: string;
  };
  hasReview?: boolean;
}

export default function Reviews() {
  const { user, profile } = useAuth();
  const [receivedReviews, setReceivedReviews] = useState<ReceivedReview[]>([]);
  const [givenReviews, setGivenReviews] = useState<ReviewData[]>([]);
  const [completedBookings, setCompletedBookings] = useState<CompletedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CompletedBooking | null>(null);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReceived: 0,
    totalGiven: 0
  });

  useEffect(() => {
    if (user && profile) {
      fetchReviews();
    }
  }, [user, profile]);

  const fetchReviews = async () => {
    try {
      if (profile?.role === 'artisan') {
        await fetchArtisanReviews();
      } else {
        await fetchClientReviews();
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArtisanReviews = async () => {
    // Get artisan record
    const { data: artisanData } = await supabase
      .from('artisans')
      .select('id')
      .eq('email', user?.email)
      .maybeSingle();

    if (!artisanData) return;

    // Fetch received reviews
    const { data: reviews } = await supabase
      .from('artisan_reviews')
      .select('*')
      .eq('artisan_id', artisanData.id)
      .order('created_at', { ascending: false });

    if (reviews) {
      setReceivedReviews(reviews as any);
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;
      setStats(prev => ({ ...prev, averageRating: avgRating, totalReceived: reviews.length }));
    }
  };

  const fetchClientReviews = async () => {
    // Fetch reviews given by this client
    const { data: givenReviewsData } = await supabase
      .from('artisan_reviews')
      .select(`
        *,
        artisan:artisans!artisan_id(full_name, email, category, city, photo_url)
      `)
      .eq('client_email', user?.email)
      .order('created_at', { ascending: false });

    if (givenReviewsData) {
      setGivenReviews(givenReviewsData as any);
      setStats(prev => ({ ...prev, totalGiven: givenReviewsData.length }));
    }

    // Fetch completed bookings for potential reviews
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select(`
        *,
        artisan:artisans!artisan_id(full_name, email, photo_url)
      `)
      .eq('client_email', user?.email)
      .eq('status', 'completed')
      .order('completion_date', { ascending: false });

    if (bookingsData) {
      // Check which bookings already have reviews
      const bookingsWithReviewStatus = await Promise.all(
        bookingsData.map(async (booking: any) => {
          const { data: existingReview } = await supabase
            .from('artisan_reviews')
            .select('id')
            .eq('artisan_id', booking.artisan_id)
            .eq('client_email', user?.email)
            .single();

          return {
            ...booking,
            hasReview: !!existingReview
          };
        })
      );

      setCompletedBookings(bookingsWithReviewStatus);
    }
  };

  const handleReviewSubmitted = () => {
    fetchReviews();
    setReviewDialogOpen(false);
    setSelectedBooking(null);
  };

  const openReviewDialog = (booking: CompletedBooking) => {
    setSelectedBooking(booking);
    setReviewDialogOpen(true);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded animate-pulse"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Reviews & Ratings</h1>
          <p className="text-muted-foreground">
            {profile?.role === 'artisan' 
              ? 'Manage your reviews and build your reputation'
              : 'Review your experiences and help others make informed decisions'
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {profile?.role === 'artisan' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on {stats.totalReceived} reviews
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {profile?.role === 'artisan' ? 'Reviews Received' : 'Reviews Given'}
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile?.role === 'artisan' ? stats.totalReceived : stats.totalGiven}
              </div>
              <p className="text-xs text-muted-foreground">
                Total reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trust Level</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageRating >= 4.5 ? 'Excellent' :
                 stats.averageRating >= 4.0 ? 'Very Good' :
                 stats.averageRating >= 3.5 ? 'Good' :
                 stats.averageRating >= 3.0 ? 'Average' : 'New'}
              </div>
              <p className="text-xs text-muted-foreground">
                Reputation level
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue={profile?.role === 'artisan' ? 'received' : 'given'}>
          <TabsList>
            {profile?.role === 'artisan' && (
              <TabsTrigger value="received">Reviews Received</TabsTrigger>
            )}
            {profile?.role === 'client' && (
              <>
                <TabsTrigger value="given">Reviews Given</TabsTrigger>
                <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Artisan: Reviews Received */}
          {profile?.role === 'artisan' && (
            <TabsContent value="received" className="space-y-4">
              {receivedReviews.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
                    <p className="text-muted-foreground">
                      Complete more jobs to start receiving reviews from clients.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                receivedReviews.map((review) => (
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
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= review.rating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
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
            </TabsContent>
          )}

          {/* Client: Reviews Given */}
          {profile?.role === 'client' && (
            <TabsContent value="given" className="space-y-4">
              {givenReviews.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No reviews given yet</h3>
                    <p className="text-muted-foreground">
                      Complete bookings and leave reviews to help other clients.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                givenReviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.artisan?.photo_url} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{review.artisan?.full_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {review.artisan?.category} • {review.artisan?.city}
                              </p>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= review.rating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
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
            </TabsContent>
          )}

          {/* Client: Pending Reviews */}
          {profile?.role === 'client' && (
            <TabsContent value="pending" className="space-y-4">
              {completedBookings.filter(b => !b.hasReview).length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No pending reviews</h3>
                    <p className="text-muted-foreground">
                      You've reviewed all your completed bookings.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                completedBookings
                  .filter(booking => !booking.hasReview)
                  .map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={booking.artisan?.photo_url} />
                              <AvatarFallback>
                                <User className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{booking.artisan?.full_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {booking.work_type} • Completed {formatDistanceToNow(new Date(booking.completion_date), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <Button 
                            onClick={() => openReviewDialog(booking)}
                            size="sm"
                          >
                            Write Review
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Review Dialog */}
        {selectedBooking && (
          <ReviewDialog
            isOpen={reviewDialogOpen}
            onClose={() => {
              setReviewDialogOpen(false);
              setSelectedBooking(null);
            }}
            artisanId={selectedBooking.artisan_id}
            artisanName={selectedBooking.artisan?.full_name || 'Artisan'}
            bookingId={selectedBooking.id}
            onReviewSubmitted={handleReviewSubmitted}
          />
        )}
      </div>
    </AppLayout>
  );
}