import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  MapPin, 
  Star, 
  Phone, 
  Mail,
  Filter,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Artisan {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  skill: string;
  category: string;
  city: string;
  profile_url: string;
  photo_url: string;
  created_at: string;
}

const categories = [
  'All Categories',
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Cleaning',
  'Garden',
  'HVAC',
  'Roofing',
  'Other'
];

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

  useEffect(() => {
    fetchArtisans();
  }, []);

  useEffect(() => {
    filterArtisans();
  }, [artisans, searchTerm, selectedCategory, selectedCity]);

  const fetchArtisans = async () => {
    try {
      const { data, error } = await supabase
        .from('artisans')
        .select('*')
        .eq('suspended', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArtisans(data || []);
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
      window.location.href = `/book?artisan=${artisan.email}&service=${artisan.category}`;
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Find Skilled Artisans</h1>
          <p className="text-muted-foreground">
            Browse and connect with verified professionals in your area
          </p>
        </div>

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
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {artisan.email}
                    </div>
                    {artisan.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {artisan.phone}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">New artisan</span>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleBookArtisan(artisan)}
                      className="flex-1"
                    >
                      Book Now
                    </Button>
                    <Button variant="outline" size="sm">
                      View Profile
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