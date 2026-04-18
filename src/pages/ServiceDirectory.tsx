import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdvancedSearch } from '@/components/search/AdvancedSearch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  MapPin, 
  Star, 
  Phone, 
  Mail,
  Filter,
  User,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SERVICE_CATEGORIES } from '@/lib/nigeria';

interface Artisan {
  id: string;
  full_name: string;
  skill: string;
  category: string;
  city: string;
  profile_url: string;
  photo_url: string;
  created_at: string;
  average_rating: number;
  total_reviews: number;
  verification_level: string;
  averageRating?: number;
  reviewCount?: number;
}

const categories = ['All Categories', ...SERVICE_CATEGORIES.map(c => c.value)];

const cities = [
  'All Cities',
  'Lagos',
  'Abuja',
  'Benin City',
  'Port Harcourt',
  'Kano',
  'Ibadan',
  'Kaduna'
];

export default function ServiceDirectory() {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [filteredArtisans, setFilteredArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchArtisans();
  }, []);

  useEffect(() => {
    filterArtisans();
  }, [artisans, searchTerm, selectedCategory, selectedCity]);

  const fetchArtisans = async () => {
    try {
      // Use the secure public view instead of direct table access
      const { data, error } = await supabase
        .from('artisans')
        .select('*')
        .eq('suspended', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // The public view already includes ratings, so we can use them directly
      const artisansWithRatings: Artisan[] = (data || []).map((artisan: any) => ({
        id: String(artisan.id || ''),
        full_name: String(artisan.full_name || ''),
        skill: String(artisan.skill || artisan.category || ''),
        category: String(artisan.category || ''),
        city: String(artisan.city || ''),
        profile_url: String(artisan.profile_url || ''),
        photo_url: String(artisan.photo_url || ''),
        created_at: String(artisan.created_at || ''),
        average_rating: Number(artisan.average_rating || 0),
        total_reviews: Number(artisan.total_reviews || 0),
        verification_level: 'unverified', // Default value since DB doesn't have this field yet
        averageRating: Number(artisan.average_rating || 0),
        reviewCount: Number(artisan.total_reviews || 0),
      }));

      setArtisans(artisansWithRatings);
    } catch (error) {
      console.error('Error fetching artisans:', error);
      toast({
        title: "Error",
        description: "Failed to load artisans. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterArtisans = () => {
    let filtered = artisans;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(artisan =>
        artisan.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artisan.skill?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artisan.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(artisan => 
        artisan.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by city
    if (selectedCity !== 'All Cities') {
      filtered = filtered.filter(artisan => 
        artisan.city?.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    setFilteredArtisans(filtered);
  };

  const handleBookArtisan = async (artisan: Artisan) => {
    try {
      // Navigate to booking form with pre-filled artisan info
      window.location.href = `/book?artisan=${artisan.id}&service=${artisan.category}`;
    } catch (error) {
      console.error('Error booking artisan:', error);
      toast({
        title: "Error",
        description: "Failed to initiate booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Find Skilled Artisans</h1>
            <p className="text-muted-foreground mt-2">
              Discover verified professionals with AI-powered recommendations
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            AI-Enhanced Search
          </Badge>
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Smart Search
            </TabsTrigger>
            <TabsTrigger value="directory">Browse Directory</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <AdvancedSearch />
          </TabsContent>

          <TabsContent value="directory" className="space-y-6">

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, skill, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredArtisans.length} artisan{filteredArtisans.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Artisans Grid */}
        {filteredArtisans.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No artisans found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtisans.map((artisan) => (
              <Card key={artisan.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      {artisan.photo_url ? (
                        <img 
                          src={artisan.photo_url} 
                          alt={artisan.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{artisan.full_name}</CardTitle>
                      <CardDescription>{artisan.skill}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Badge variant="secondary">{artisan.category}</Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {artisan.city}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <Badge variant="outline" className="mr-2">{artisan.verification_level}</Badge>
                      Contact via booking only (for security)
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">
                      {artisan.averageRating && artisan.averageRating > 0 
                        ? `${artisan.averageRating} (${artisan.reviewCount} review${artisan.reviewCount !== 1 ? 's' : ''})`
                        : 'New artisan'
                      }
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleBookArtisan(artisan)}
                      className="flex-1"
                    >
                      Book Now
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/artisan/${artisan.id}/portfolio`)}
                    >
                      View Portfolio
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}