import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Star, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ROUTES } from '@/config/routes';

interface FavoriteArtisan {
  id: string;
  favorite_id: string;
  full_name: string;
  category: string;
  city: string;
  rating?: number;
  completed_jobs?: number;
  photo_url?: string;
}

export default function Favorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteArtisan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      // Query favorites table joined with artisan profile data
      const { data, error } = await (supabase as any)
        .from('artisan_favorites')
        .select(`
          id,
          artisan_id,
          artisans:artisan_id (
            id,
            full_name,
            category,
            city,
            rating,
            completed_jobs,
            photo_url
          )
        `)
        .eq('client_id', user?.id);

      if (error) {
        // Table may not exist — show empty state gracefully
        console.warn('Favorites fetch error (table may not exist):', error.message);
        setFavorites([]);
        return;
      }

      const mapped: FavoriteArtisan[] = (data || [])
        .filter((row: any) => row.artisans)
        .map((row: any) => ({
          id: row.artisans.id,
          favorite_id: row.id,
          full_name: row.artisans.full_name || 'Unknown Artisan',
          category: row.artisans.category || 'General',
          city: row.artisans.city || '',
          rating: row.artisans.rating,
          completed_jobs: row.artisans.completed_jobs,
          photo_url: row.artisans.photo_url,
        }));

      setFavorites(mapped);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    const { error } = await (supabase as any)
      .from('artisan_favorites')
      .delete()
      .eq('id', favoriteId)
      .eq('client_id', user?.id);

    if (!error) {
      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      toast({ title: 'Removed from favorites' });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Favorite Artisans</h1>
            <p className="text-muted-foreground">Your trusted service providers</p>
          </div>
          <Badge variant="secondary">{favorites.length} Favorites</Badge>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-4">
              Start adding artisans to your favorites to quickly book their services.
            </p>
            <Button asChild>
              <Link to={ROUTES.SERVICES}>Browse Artisans</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((artisan) => (
              <Card key={artisan.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{artisan.full_name}</CardTitle>
                      <Badge variant="outline">{artisan.category}</Badge>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => removeFavorite(artisan.favorite_id)}
                      title="Remove from favorites"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {artisan.rating !== undefined && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{artisan.rating}</span>
                      {artisan.completed_jobs !== undefined && (
                        <span className="text-muted-foreground">({artisan.completed_jobs} jobs)</span>
                      )}
                    </div>
                  )}

                  {artisan.city && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{artisan.city}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1" asChild>
                      <Link to={`${ROUTES.BOOK}?artisan=${artisan.id}`}>Book Now</Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={ROUTES.MESSAGES}>Message</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
