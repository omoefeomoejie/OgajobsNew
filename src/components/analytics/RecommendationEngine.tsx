import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Target, 
  DollarSign, 
  TrendingUp,
  MapPin,
  Clock,
  Star,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ArtisanRecommendation {
  artisan_id: string;
  artisan_name: string;
  artisan_email: string;
  service_category: string;
  match_score: number;
  distance_km: number;
  rating: number;
  price_estimate: number;
  availability_score: number;
  experience_years: number;
  recommendation_reasons: string[];
  booking_probability: number;
}

interface ServiceRecommendation {
  client_id: string;
  client_email: string;
  recommended_service: string;
  recommendation_score: number;
  predicted_budget: number;
  urgency_level: string;
  location_match: boolean;
  seasonal_factor: number;
  reason: string;
  historical_pattern: string;
}

interface PricingRecommendation {
  service_category: string;
  location: string;
  current_avg_price: number;
  recommended_price: number;
  price_adjustment: number;
  market_demand: number;
  competition_level: number;
  optimization_type: 'increase_revenue' | 'increase_bookings' | 'competitive_edge';
  confidence: number;
  expected_impact: string;
}

interface CrossSellOpportunity {
  client_id: string;
  client_email: string;
  primary_service: string;
  additional_services: string[];
  bundle_value: number;
  probability_score: number;
  timing_recommendation: string;
  revenue_potential: number;
}

export default function RecommendationEngine() {
  const [artisanRecommendations, setArtisanRecommendations] = useState<ArtisanRecommendation[]>([]);
  const [serviceRecommendations, setServiceRecommendations] = useState<ServiceRecommendation[]>([]);
  const [pricingRecommendations, setPricingRecommendations] = useState<PricingRecommendation[]>([]);
  const [crossSellOpportunities, setCrossSellOpportunities] = useState<CrossSellOpportunity[]>([]);
  
  const [searchFilters, setSearchFilters] = useState({
    location: '',
    service_category: '',
    budget_range: '',
    urgency: 'normal'
  });
  
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      
      // Fetch artisan recommendations
      const { data: artisanData, error: artisanError } = await supabase.functions.invoke('get-artisan-recommendations', {
        body: { 
          filters: searchFilters,
          limit: 20
        }
      });

      if (artisanError) throw artisanError;

      setArtisanRecommendations(artisanData?.recommendations || []);
      
      // Generate mock data for other recommendations
      const mockServiceRecommendations: ServiceRecommendation[] = [
        {
          client_id: 'client-1',
          client_email: 'client@example.com',
          recommended_service: 'Deep Cleaning',
          recommendation_score: 85,
          predicted_budget: 15000,
          urgency_level: 'normal',
          location_match: true,
          seasonal_factor: 1.2,
          reason: 'Based on recent booking history',
          historical_pattern: 'Books cleaning services quarterly'
        }
      ];

      const mockCrossSell: CrossSellOpportunity[] = [
        {
          client_id: 'client-1',
          client_email: 'client@example.com',
          primary_service: 'Plumbing',
          additional_services: ['Electrical Work', 'Painting'],
          bundle_value: 35000,
          probability_score: 75,
          timing_recommendation: 'Within 2 weeks',
          revenue_potential: 25000
        }
      ];

      const mockPricingRecommendations: PricingRecommendation[] = [
        {
          service_category: 'Plumbing',
          location: 'Lagos',
          current_avg_price: 12000,
          recommended_price: 13500,
          price_adjustment: 12.5,
          market_demand: 4,
          competition_level: 3,
          optimization_type: 'increase_revenue',
          confidence: 82,
          expected_impact: 'Increase revenue by 15-20%'
        }
      ];

      setServiceRecommendations(mockServiceRecommendations);
      setCrossSellOpportunities(mockCrossSell);
      setPricingRecommendations(mockPricingRecommendations);

    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to load recommendation data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    try {
      toast({
        title: "Generating Recommendations",
        description: "AI is analyzing user behavior and market data...",
      });

      const { data, error } = await supabase.functions.invoke('update-recommendations', {
        body: { 
          refresh_all: true,
          include_ml_insights: true
        }
      });

      if (error) throw error;

      toast({
        title: "Recommendations Updated",
        description: `Generated ${data.total_recommendations} new recommendations`,
      });

      fetchRecommendations();
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to generate recommendations",
        variant: "destructive",
      });
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 75) return 'text-blue-600 bg-blue-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  const getPriceChangeColor = (adjustment: number) => {
    if (adjustment > 0) return 'text-green-600';
    if (adjustment < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Recommendation Engine</h1>
          <p className="text-muted-foreground">Personalized recommendations and market insights</p>
        </div>
        <Button onClick={generateRecommendations} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Update Recommendations
        </Button>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input
                placeholder="Enter city"
                value={searchFilters.location}
                onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Service Category</label>
              <Select 
                value={searchFilters.service_category} 
                onValueChange={(value) => setSearchFilters({...searchFilters, service_category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="painting">Painting</SelectItem>
                  <SelectItem value="carpentry">Carpentry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Budget Range</label>
              <Select 
                value={searchFilters.budget_range} 
                onValueChange={(value) => setSearchFilters({...searchFilters, budget_range: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Budget</SelectItem>
                  <SelectItem value="0-5000">₦0 - ₦5,000</SelectItem>
                  <SelectItem value="5000-15000">₦5,000 - ₦15,000</SelectItem>
                  <SelectItem value="15000-50000">₦15,000 - ₦50,000</SelectItem>
                  <SelectItem value="50000+">₦50,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Urgency</label>
              <Select 
                value={searchFilters.urgency} 
                onValueChange={(value) => setSearchFilters({...searchFilters, urgency: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={fetchRecommendations} className="w-full">
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="artisans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="artisans">Artisan Recommendations</TabsTrigger>
          <TabsTrigger value="services">Service Suggestions</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Optimization</TabsTrigger>
          <TabsTrigger value="cross-sell">Cross-sell Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="artisans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Personalized Artisan Recommendations
              </CardTitle>
              <CardDescription>
                AI-matched artisans based on location, requirements, and performance history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {artisanRecommendations.map((rec) => (
                  <div key={rec.artisan_id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{rec.artisan_name}</h4>
                          <Badge className={getMatchColor(rec.match_score)}>
                            {rec.match_score}% match
                          </Badge>
                          <Badge variant="outline">
                            <Star className="w-3 h-3 mr-1" />
                            {rec.rating.toFixed(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.service_category}</p>
                        <p className="text-xs text-muted-foreground">{rec.artisan_email}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-lg font-bold">₦{rec.price_estimate.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {rec.distance_km.toFixed(1)}km away
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Availability</div>
                        <Progress value={rec.availability_score} className="h-2" />
                        <div className="text-xs">{rec.availability_score}%</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Experience</div>
                        <div className="text-sm font-medium">{rec.experience_years} years</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Booking Probability</div>
                        <div className="text-sm font-medium">{rec.booking_probability}%</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Distance</div>
                        <div className="text-sm font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {rec.distance_km.toFixed(1)}km
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Why recommended:</div>
                      <div className="flex flex-wrap gap-1">
                        {rec.recommendation_reasons.map((reason, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {artisanRecommendations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No artisan recommendations available. Adjust filters and try again.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Service Suggestions
              </CardTitle>
              <CardDescription>
                AI-suggested services based on location and user history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceRecommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-medium">{rec.recommended_service}</h4>
                        <p className="text-sm text-muted-foreground">{rec.client_email}</p>
                        <p className="text-xs text-muted-foreground">{rec.reason}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge className={getMatchColor(rec.recommendation_score)}>
                          {rec.recommendation_score}% match
                        </Badge>
                        <div className="text-sm">₦{rec.predicted_budget.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Urgency</div>
                        <Badge variant={rec.urgency_level === 'high' ? 'destructive' : 'secondary'}>
                          {rec.urgency_level}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Location Match</div>
                        <div className="flex items-center justify-center">
                          {rec.location_match ? (
                            <Badge variant="default">Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Seasonal Factor</div>
                        <div className="font-medium">{(rec.seasonal_factor * 100).toFixed(0)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Pattern</div>
                        <div className="text-xs">{rec.historical_pattern}</div>
                      </div>
                    </div>
                  </div>
                ))}

                {serviceRecommendations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No service recommendations available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Optimal Pricing Recommendations
              </CardTitle>
              <CardDescription>
                AI-optimized pricing strategies for maximum revenue and bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pricingRecommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-medium">{rec.service_category}</h4>
                        <p className="text-sm text-muted-foreground">{rec.location}</p>
                        <Badge variant="outline">{rec.optimization_type.replace('_', ' ')}</Badge>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-lg font-bold">
                          ₦{rec.recommended_price.toLocaleString()}
                        </div>
                        <div className={`text-sm ${getPriceChangeColor(rec.price_adjustment)}`}>
                          {rec.price_adjustment > 0 ? '+' : ''}
                          {rec.price_adjustment.toFixed(1)}% vs current
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Current Price</div>
                        <div className="font-medium">₦{rec.current_avg_price.toLocaleString()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Market Demand</div>
                        <Progress value={rec.market_demand} className="h-2 mx-auto w-16" />
                        <div className="text-xs">{rec.market_demand}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Competition</div>
                        <Progress value={rec.competition_level} className="h-2 mx-auto w-16" />
                        <div className="text-xs">{rec.competition_level}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Confidence</div>
                        <div className="font-medium">{rec.confidence}%</div>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded p-3">
                      <div className="text-sm font-medium mb-1">Expected Impact:</div>
                      <p className="text-sm text-muted-foreground">{rec.expected_impact}</p>
                    </div>
                  </div>
                ))}

                {pricingRecommendations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No pricing recommendations available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cross-sell" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Cross-sell Opportunities
              </CardTitle>
              <CardDescription>
                AI-identified opportunities to increase revenue per customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {crossSellOpportunities.map((opp, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-medium">{opp.client_email}</h4>
                        <p className="text-sm text-muted-foreground">
                          Primary: {opp.primary_service}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Timing: {opp.timing_recommendation}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-lg font-bold">₦{opp.revenue_potential.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Revenue potential</div>
                        <Badge className={getMatchColor(opp.probability_score)}>
                          {opp.probability_score}% likely
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Additional Services:</div>
                      <div className="flex flex-wrap gap-1">
                        {opp.additional_services.map((service, idx) => (
                          <Badge key={idx} variant="secondary">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded p-3">
                      <div className="text-sm font-medium text-blue-800 mb-1">
                        Bundle Value: ₦{opp.bundle_value.toLocaleString()}
                      </div>
                      <p className="text-sm text-blue-700">
                        Potential savings for customer while increasing revenue
                      </p>
                    </div>
                  </div>
                ))}

                {crossSellOpportunities.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No cross-sell opportunities identified.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}