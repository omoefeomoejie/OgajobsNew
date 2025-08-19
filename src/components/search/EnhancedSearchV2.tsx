import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  DollarSign, 
  Filter,
  Mic,
  Camera,
  Sparkles,
  TrendingUp,
  Heart,
  Share2,
  Phone,
  MessageCircle,
  Calendar,
  Award,
  Verified,
  Target,
  Brain,
  Eye,
  Volume2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnhancedArtisan {
  id: string;
  full_name: string;
  category: string;
  city: string;
  skill: string;
  photo_url?: string;
  profile_url?: string;
  average_rating: number;
  total_reviews: number;
  verification_level: string;
  response_time: number;
  completion_rate: number;
  starting_price: number;
  availability_status: 'available' | 'busy' | 'offline';
  distance?: number;
  match_score?: number;
  recommendation_reasons?: string[];
  recent_work?: string[];
  specializations?: string[];
  languages?: string[];
  certifications?: string[];
  portfolio_highlights?: string[];
}

interface SearchFilters {
  category?: string;
  city?: string;
  minRating?: number;
  maxPrice?: number;
  availability?: string;
  verificationLevel?: string;
  distance?: number;
}

interface SearchSuggestion {
  text: string;
  type: 'recent' | 'trending' | 'popular';
  count?: number;
}

interface VoiceSearchState {
  isListening: boolean;
  transcript: string;
  confidence: number;
}

export function EnhancedSearchV2() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [artisans, setArtisans] = useState<EnhancedArtisan[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedArtisan, setSelectedArtisan] = useState<EnhancedArtisan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [voiceSearch, setVoiceSearch] = useState<VoiceSearchState>({
    isListening: false,
    transcript: '',
    confidence: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();

  // Voice search setup
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = useMemo(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';
      return rec;
    }
    return null;
  }, []);

  // Enhanced search with semantic understanding
  const performEnhancedSearch = useCallback(async (query: string, searchFilters: SearchFilters = {}) => {
    if (!query.trim() && Object.keys(searchFilters).length === 0) {
      setArtisans([]);
      return;
    }

    setIsLoading(true);
    try {
      // Use AI search edge function for semantic search
      const { data, error } = await supabase.functions.invoke('ai-search', {
        body: {
          query: query.trim(),
          filters: searchFilters,
          location: await getCurrentLocation(),
          searchType: 'semantic',
          includeRecommendations: true,
          maxResults: 50
        }
      });

      if (error) throw error;

      // Enhance results with additional data
      const enhancedResults = await Promise.all(
        data.results.map(async (artisan: any) => {
          // Get additional data like portfolio, reviews, etc.
          const [portfolioData, availabilityData] = await Promise.all([
            supabase.from('portfolios').select('*').eq('artisan_id', artisan.id).limit(3),
            supabase.from('artisan_availability').select('*').eq('artisan_id', artisan.id)
          ]);

          return {
            ...artisan,
            portfolio_highlights: portfolioData.data?.map(p => p.cover_image_url) || [],
            availability_status: determineAvailabilityStatus(availabilityData.data),
            match_score: data.match_scores?.[artisan.id] || 0,
            recommendation_reasons: data.recommendations?.[artisan.id] || []
          };
        })
      );

      setArtisans(enhancedResults);

      // Update search suggestions
      if (query.trim()) {
        updateSearchSuggestions(query);
      }

    } catch (error) {
      console.error('Enhanced search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to perform search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Voice search functionality
  const startVoiceSearch = useCallback(() => {
    if (!recognition) {
      toast({
        title: "Voice Search Unavailable",
        description: "Voice search is not supported in your browser.",
        variant: "destructive"
      });
      return;
    }

    setVoiceSearch(prev => ({ ...prev, isListening: true, transcript: '' }));

    recognition.onresult = (event) => {
      let transcript = '';
      let confidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        confidence = event.results[i][0].confidence;
      }

      setVoiceSearch(prev => ({ ...prev, transcript, confidence }));

      if (event.results[event.results.length - 1].isFinal) {
        setSearchQuery(transcript);
        performEnhancedSearch(transcript, filters);
        setVoiceSearch(prev => ({ ...prev, isListening: false }));
      }
    };

    recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error);
      setVoiceSearch(prev => ({ ...prev, isListening: false }));
      toast({
        title: "Voice Search Error",
        description: "Failed to recognize speech. Please try again.",
        variant: "destructive"
      });
    };

    recognition.onend = () => {
      setVoiceSearch(prev => ({ ...prev, isListening: false }));
    };

    recognition.start();
  }, [recognition, filters, performEnhancedSearch, toast]);

  // Visual search (placeholder for future implementation)
  const startVisualSearch = useCallback(() => {
    toast({
      title: "Visual Search",
      description: "Visual search feature coming soon! Upload an image to find similar services.",
    });
  }, [toast]);

  // Get current location for proximity search
  const getCurrentLocation = useCallback((): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => resolve(null),
        { timeout: 5000 }
      );
    });
  }, []);

  // Update search suggestions based on query
  const updateSearchSuggestions = useCallback(async (query: string) => {
    // Store recent searches
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const updatedSearches = [query, ...recentSearches.filter((s: string) => s !== query)].slice(0, 10);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));

    // Generate suggestions (this would typically come from analytics)
    const mockSuggestions: SearchSuggestion[] = [
      { text: 'plumber near me', type: 'trending', count: 245 },
      { text: 'electrician Lagos', type: 'popular', count: 189 },
      { text: 'carpenter Abuja', type: 'trending', count: 156 },
      { text: 'cleaner weekend', type: 'popular', count: 134 }
    ];

    setSuggestions(mockSuggestions);
  }, []);

  // Determine availability status
  const determineAvailabilityStatus = (availabilityData: any[]): 'available' | 'busy' | 'offline' => {
    if (!availabilityData || availabilityData.length === 0) return 'offline';
    
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const todayAvailability = availabilityData.find(a => a.day_of_week === currentDay);
    if (!todayAvailability) return 'offline';

    const startTime = parseTime(todayAvailability.start_time);
    const endTime = parseTime(todayAvailability.end_time);

    if (currentTime >= startTime && currentTime <= endTime) {
      return todayAvailability.is_available ? 'available' : 'busy';
    }
    
    return 'offline';
  };

  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Filter artisans based on active tab
  const filteredArtisans = useMemo(() => {
    switch (activeTab) {
      case 'ai-recommended':
        return artisans
          .filter(a => a.match_score && a.match_score > 0.7)
          .sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
      case 'nearby':
        return artisans
          .filter(a => a.distance && a.distance < 10)
          .sort((a, b) => (a.distance || 0) - (b.distance || 0));
      case 'verified':
        return artisans.filter(a => a.verification_level === 'premium');
      case 'available':
        return artisans.filter(a => a.availability_status === 'available');
      default:
        return artisans.sort((a, b) => b.average_rating - a.average_rating);
    }
  }, [artisans, activeTab]);

  // Load initial suggestions
  useEffect(() => {
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const recentSuggestions = recentSearches.map((text: string) => ({ text, type: 'recent' as const }));
    setSuggestions(recentSuggestions);
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        performEnhancedSearch(searchQuery, filters);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters, performEnhancedSearch]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Enhanced Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search for services, artisans, or describe what you need..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-24 h-12 text-lg"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startVoiceSearch}
                  disabled={voiceSearch.isListening}
                  className={voiceSearch.isListening ? 'text-red-500' : ''}
                >
                  {voiceSearch.isListening ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={startVisualSearch}>
                  <Camera className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Voice Search Feedback */}
            {voiceSearch.isListening && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Listening... {voiceSearch.transcript && `"${voiceSearch.transcript}"`}
              </div>
            )}

            {/* Search Suggestions */}
            {!searchQuery && suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Suggestions</div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 6).map((suggestion, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => setSearchQuery(suggestion.text)}
                    >
                      {suggestion.type === 'trending' && <TrendingUp className="w-3 h-3 mr-1" />}
                      {suggestion.type === 'recent' && <Clock className="w-3 h-3 mr-1" />}
                      {suggestion.text}
                      {suggestion.count && <span className="ml-1 text-xs">({suggestion.count})</span>}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-muted rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-4/5"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">
              All Results ({artisans.length})
            </TabsTrigger>
            <TabsTrigger value="ai-recommended">
              <Brain className="w-4 h-4 mr-2" />
              AI Recommended
            </TabsTrigger>
            <TabsTrigger value="nearby">
              <MapPin className="w-4 h-4 mr-2" />
              Nearby
            </TabsTrigger>
            <TabsTrigger value="verified">
              <Verified className="w-4 h-4 mr-2" />
              Verified
            </TabsTrigger>
            <TabsTrigger value="available">
              <Target className="w-4 h-4 mr-2" />
              Available Now
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredArtisans.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filters</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArtisans.map((artisan) => (
                  <Card 
                    key={artisan.id} 
                    className="group cursor-pointer hover:shadow-lg transition-all duration-200"
                    onClick={() => setSelectedArtisan(artisan)}
                  >
                    <CardContent className="p-6">
                      {/* Header with AI recommendations */}
                      {artisan.match_score && artisan.match_score > 0.8 && (
                        <div className="flex items-center gap-2 mb-4 p-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            AI Recommended ({Math.round(artisan.match_score * 100)}% match)
                          </span>
                        </div>
                      )}

                      {/* Artisan Info */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative">
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={artisan.photo_url} alt={artisan.full_name} />
                            <AvatarFallback>{artisan.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            artisan.availability_status === 'available' ? 'bg-green-500' :
                            artisan.availability_status === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{artisan.full_name}</h3>
                            {artisan.verification_level === 'premium' && (
                              <Award className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{artisan.category}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">{artisan.average_rating.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">({artisan.total_reviews})</span>
                            </div>
                            {artisan.distance && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{artisan.distance.toFixed(1)}km</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Recommendation Reasons */}
                      {artisan.recommendation_reasons && artisan.recommendation_reasons.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs font-medium text-muted-foreground mb-2">Why this artisan:</div>
                          <div className="flex flex-wrap gap-1">
                            {artisan.recommendation_reasons.slice(0, 2).map((reason, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Portfolio Preview */}
                      {artisan.portfolio_highlights && artisan.portfolio_highlights.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs font-medium text-muted-foreground mb-2">Recent work:</div>
                          <div className="flex gap-2">
                            {artisan.portfolio_highlights.slice(0, 3).map((image, index) => (
                              <div key={index} className="w-12 h-12 rounded bg-muted"></div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Separator className="my-4" />

                      {/* Quick Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium">From ₦{artisan.starting_price?.toLocaleString()}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <Heart className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Artisan Detail Dialog */}
      <Dialog open={!!selectedArtisan} onOpenChange={() => setSelectedArtisan(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedArtisan && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={selectedArtisan.photo_url} alt={selectedArtisan.full_name} />
                    <AvatarFallback>{selectedArtisan.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle className="flex items-center gap-2">
                      {selectedArtisan.full_name}
                      {selectedArtisan.verification_level === 'premium' && (
                        <Award className="w-5 h-5 text-blue-500" />
                      )}
                    </DialogTitle>
                    <DialogDescription>{selectedArtisan.category} • {selectedArtisan.city}</DialogDescription>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-medium">{selectedArtisan.average_rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({selectedArtisan.total_reviews} reviews)</span>
                      </div>
                      <Badge variant={selectedArtisan.availability_status === 'available' ? 'default' : 'secondary'}>
                        {selectedArtisan.availability_status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* About */}
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-muted-foreground">{selectedArtisan.skill}</p>
                  </div>

                  {/* Services & Pricing */}
                  <div>
                    <h3 className="font-semibold mb-2">Services & Pricing</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 border rounded">
                        <span>{selectedArtisan.category}</span>
                        <span className="font-medium">From ₦{selectedArtisan.starting_price?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio */}
                  {selectedArtisan.portfolio_highlights && selectedArtisan.portfolio_highlights.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Portfolio</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {selectedArtisan.portfolio_highlights.map((image, index) => (
                          <div key={index} className="aspect-square bg-muted rounded-lg"></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Contact Actions */}
                  <div className="space-y-2">
                    <Button className="w-full">
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Now
                    </Button>
                    <Button variant="outline" className="w-full">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                  </div>

                  {/* Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Response time</span>
                        <span className="text-sm font-medium">{selectedArtisan.response_time}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Completion rate</span>
                        <span className="text-sm font-medium">{selectedArtisan.completion_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Verification level</span>
                        <Badge variant="outline">{selectedArtisan.verification_level}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}