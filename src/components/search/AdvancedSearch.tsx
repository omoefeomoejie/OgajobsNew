import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { SERVICE_CATEGORIES } from '@/lib/nigeria';
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  User, 
  Zap,
  TrendingUp,
  Heart,
  MessageSquare,
  Phone,
  Mail,
  CheckCircle,
  Award,
  Target
} from 'lucide-react';

interface Artisan {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  skill: string;
  category: string;
  city: string;
  photo_url?: string;
  profile_url?: string;
  suspended: boolean;
  created_at: string;
  rating?: number;
  reviews_count?: number;
  completed_jobs?: number;
  response_time?: number;
  price_range?: string;
  availability?: string;
  verified?: boolean;
  specialties?: string[];
  experience_years?: number;
}

interface SearchFilters {
  category: string;
  city: string;
  minRating: number;
  maxPrice: number;
  availability: string;
  experience: string;
  verified: boolean;
  sortBy: 'relevance' | 'rating' | 'price' | 'distance' | 'recent';
}

interface RecommendationReason {
  type: 'high_rating' | 'quick_response' | 'specialty_match' | 'location_match' | 'price_match';
  description: string;
}

interface SearchAnalytics {
  query: string;
  filters: SearchFilters;
  results_count: number;
  user_id?: string;
  timestamp: string;
}


const CITIES = [
  'Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City',
  'Kaduna', 'Jos', 'Ilorin', 'Owerri', 'Enugu', 'Calabar'
];

export function AdvancedSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [filteredArtisans, setFilteredArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);
  const [recommendations, setRecommendations] = useState<{ artisan: Artisan; reasons: RecommendationReason[] }[]>([]);
  const { toast } = useToast();

  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    city: '',
    minRating: 0,
    maxPrice: 100000,
    availability: '',
    experience: '',
    verified: false,
    sortBy: 'relevance'
  });

  useEffect(() => {
    fetchArtisans();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchQuery, filters, artisans]);

  const fetchArtisans = async () => {
    try {
      setLoading(true);
      
      // In a real app, this would fetch from the artisans table
      // For now, we'll use mock data with realistic information
      const mockArtisans: Artisan[] = [
        {
          id: '1',
          full_name: 'John Okoro',
          email: 'john.okoro@example.com',
          phone: '+234-801-234-5678',
          skill: 'Expert Plumber',
          category: 'Plumbing',
          city: 'Lagos',
          photo_url: '/placeholder-avatar.jpg',
          suspended: false,
          created_at: '2023-01-15',
          rating: 4.9,
          reviews_count: 127,
          completed_jobs: 156,
          response_time: 30,
          price_range: '₦15,000 - ₦50,000',
          availability: 'Available Today',
          verified: true,
          specialties: ['Pipe Installation', 'Leak Repair', 'Water Heater'],
          experience_years: 8
        },
        {
          id: '2',
          full_name: 'Mary Adebayo',
          email: 'mary.adebayo@example.com',
          phone: '+234-802-345-6789',
          skill: 'Licensed Electrician',
          category: 'Electrical',
          city: 'Lagos',
          suspended: false,
          created_at: '2023-03-20',
          rating: 4.8,
          reviews_count: 89,
          completed_jobs: 102,
          response_time: 45,
          price_range: '₦20,000 - ₦80,000',
          availability: 'Available Tomorrow',
          verified: true,
          specialties: ['Wiring', 'Solar Installation', 'Generator Repair'],
          experience_years: 6
        },
        {
          id: '3',
          full_name: 'David Ikechukwu',
          email: 'david.ikechukwu@example.com',
          phone: '+234-803-456-7890',
          skill: 'Master Carpenter',
          category: 'Carpentry',
          city: 'Abuja',
          suspended: false,
          created_at: '2022-11-10',
          rating: 4.7,
          reviews_count: 64,
          completed_jobs: 78,
          response_time: 60,
          price_range: '₦25,000 - ₦100,000',
          availability: 'Available This Week',
          verified: false,
          specialties: ['Furniture Making', 'Cabinet Installation', 'Flooring'],
          experience_years: 12
        },
        {
          id: '4',
          full_name: 'Grace Okafor',
          email: 'grace.okafor@example.com',
          phone: '+234-804-567-8901',
          skill: 'Professional Cleaner',
          category: 'Cleaning',
          city: 'Lagos',
          suspended: false,
          created_at: '2023-06-05',
          rating: 4.6,
          reviews_count: 143,
          completed_jobs: 189,
          response_time: 20,
          price_range: '₦8,000 - ₦25,000',
          availability: 'Available Today',
          verified: true,
          specialties: ['Deep Cleaning', 'Office Cleaning', 'Post-Construction'],
          experience_years: 4
        }
      ];

      setArtisans(mockArtisans);
      generateAIRecommendations(mockArtisans);
      
    } catch (error) {
      console.error('Error fetching artisans:', error);
      toast({
        title: "Error",
        description: "Failed to load artisans",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIRecommendations = (artisansList: Artisan[]) => {
    // AI-powered recommendation logic
    const recommendedArtisans = artisansList
      .filter(artisan => !artisan.suspended)
      .map(artisan => {
        const reasons: RecommendationReason[] = [];
        
        if (artisan.rating && artisan.rating >= 4.8) {
          reasons.push({
            type: 'high_rating',
            description: `Highly rated (${artisan.rating}/5) with ${artisan.reviews_count} reviews`
          });
        }
        
        if (artisan.response_time && artisan.response_time <= 30) {
          reasons.push({
            type: 'quick_response',
            description: `Quick response time (${artisan.response_time} minutes average)`
          });
        }
        
        if (artisan.verified) {
          reasons.push({
            type: 'specialty_match',
            description: 'Verified professional with proven track record'
          });
        }
        
        if (artisan.city === 'Lagos') {
          reasons.push({
            type: 'location_match',
            description: 'Located in your area for faster service'
          });
        }

        return { artisan, reasons };
      })
      .filter(item => item.reasons.length > 0)
      .sort((a, b) => b.reasons.length - a.reasons.length)
      .slice(0, 3);

    setRecommendations(recommendedArtisans);
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...artisans];

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(artisan =>
        artisan.full_name.toLowerCase().includes(query) ||
        artisan.skill.toLowerCase().includes(query) ||
        artisan.category.toLowerCase().includes(query) ||
        artisan.specialties?.some(specialty => 
          specialty.toLowerCase().includes(query)
        )
      );
    }

    // Apply filters
    if (filters.category) {
      filtered = filtered.filter(artisan => artisan.category === filters.category);
    }

    if (filters.city) {
      filtered = filtered.filter(artisan => artisan.city === filters.city);
    }

    if (filters.minRating > 0) {
      filtered = filtered.filter(artisan => 
        artisan.rating && artisan.rating >= filters.minRating
      );
    }

    if (filters.verified) {
      filtered = filtered.filter(artisan => artisan.verified);
    }

    // Sort results
    switch (filters.sortBy) {
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'recent':
        filtered.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'relevance':
      default:
        // Keep current order for relevance
        break;
    }

    setFilteredArtisans(filtered);

    // Track search analytics
    trackSearchAnalytics();
  };

  const trackSearchAnalytics = async () => {
    const analytics: SearchAnalytics = {
      query: searchQuery,
      filters,
      results_count: filteredArtisans.length,
      timestamp: new Date().toISOString()
    };

    // Search analytics tracked
    // In a real app, this would be saved to a database
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      city: '',
      minRating: 0,
      maxPrice: 100000,
      availability: '',
      experience: '',
      verified: false,
      sortBy: 'relevance'
    });
    setSearchQuery('');
  };

  const getReasonIcon = (type: RecommendationReason['type']) => {
    switch (type) {
      case 'high_rating': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'quick_response': return <Zap className="h-4 w-4 text-blue-500" />;
      case 'specialty_match': return <Award className="h-4 w-4 text-purple-500" />;
      case 'location_match': return <MapPin className="h-4 w-4 text-green-500" />;
      case 'price_match': return <DollarSign className="h-4 w-4 text-orange-500" />;
      default: return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search for services, artisans, or specialties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Advanced Filters
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {SERVICE_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>City</Label>
                  <Select value={filters.city} onValueChange={(value) => handleFilterChange('city', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Cities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {CITIES.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Sort By</Label>
                  <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="recent">Most Recent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Minimum Rating: {filters.minRating}/5</Label>
                <Slider
                  value={[filters.minRating]}
                  onValueChange={([value]) => handleFilterChange('minRating', value)}
                  min={0}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={filters.verified}
                  onCheckedChange={(checked) => handleFilterChange('verified', checked)}
                />
                <Label>Verified Artisans Only</Label>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Results ({filteredArtisans.length})</TabsTrigger>
          <TabsTrigger value="recommended">AI Recommended ({recommendations.length})</TabsTrigger>
          <TabsTrigger value="nearby">Near You</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading artisans...</p>
            </div>
          ) : filteredArtisans.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No artisans found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredArtisans.map((artisan) => (
                <ArtisanCard 
                  key={artisan.id} 
                  artisan={artisan} 
                  onSelect={setSelectedArtisan}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommended" className="space-y-4">
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">AI-Powered Recommendations</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              These artisans are recommended based on their performance, ratings, and match with your needs.
            </p>
          </div>

          {recommendations.map(({ artisan, reasons }, index) => (
            <Card key={artisan.id} className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      #{index + 1} Recommended
                    </Badge>
                    {artisan.verified && (
                      <Badge variant="outline" className="border-green-500 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-lg mb-1">{artisan.full_name}</h3>
                    <p className="text-muted-foreground mb-2">{artisan.skill}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{artisan.rating}/5 ({artisan.reviews_count} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{artisan.city}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{artisan.response_time}min response</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Why Recommended:</h4>
                      {reasons.map((reason, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          {getReasonIcon(reason.type)}
                          <span>{reason.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">{artisan.price_range}</p>
                    <p className="text-sm text-green-600">{artisan.availability}</p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setSelectedArtisan(artisan)}>
                        View Profile
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="nearby" className="space-y-4">
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Location-based Results</h3>
            <p className="text-muted-foreground">Enable location access to see nearby artisans</p>
            <Button className="mt-4">Enable Location</Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Artisan Profile Dialog */}
      {selectedArtisan && (
        <ArtisanProfileDialog 
          artisan={selectedArtisan} 
          onClose={() => setSelectedArtisan(null)} 
        />
      )}
    </div>
  );
}

// Artisan Card Component
function ArtisanCard({ artisan, onSelect }: { artisan: Artisan; onSelect: (artisan: Artisan) => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect(artisan)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{artisan.full_name}</h3>
            {artisan.verified && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
          <Badge variant="secondary">{artisan.category}</Badge>
        </div>

        <p className="text-muted-foreground mb-2">{artisan.skill}</p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span>{artisan.rating}/5</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{artisan.city}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{artisan.response_time}min</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{artisan.price_range}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Heart className="h-4 w-4" />
            </Button>
            <Button size="sm">Contact</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Artisan Profile Dialog Component
function ArtisanProfileDialog({ artisan, onClose }: { artisan: Artisan; onClose: () => void }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {artisan.full_name}
            {artisan.verified && <CheckCircle className="h-5 w-5 text-green-500" />}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Professional Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Skill:</span> {artisan.skill}</p>
                <p><span className="font-medium">Category:</span> {artisan.category}</p>
                <p><span className="font-medium">Experience:</span> {artisan.experience_years} years</p>
                <p><span className="font-medium">Location:</span> {artisan.city}</p>
                <p><span className="font-medium">Price Range:</span> {artisan.price_range}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Performance Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{artisan.rating}/5 ({artisan.reviews_count} reviews)</span>
                </div>
                <p><span className="font-medium">Completed Jobs:</span> {artisan.completed_jobs}</p>
                <p><span className="font-medium">Response Time:</span> {artisan.response_time} minutes</p>
                <p><span className="font-medium">Availability:</span> {artisan.availability}</p>
              </div>
            </div>
          </div>

          {artisan.specialties && (
            <div>
              <h3 className="font-semibold mb-2">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {artisan.specialties.map((specialty, index) => (
                  <Badge key={index} variant="outline">{specialty}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>
            <Button variant="outline" className="flex-1">
              <Phone className="h-4 w-4 mr-2" />
              Call Now
            </Button>
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
