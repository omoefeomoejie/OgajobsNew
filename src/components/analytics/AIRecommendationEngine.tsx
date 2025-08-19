import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  Heart, 
  Users, 
  Clock, 
  Star, 
  MapPin,
  Zap,
  Target,
  Eye,
  RefreshCw,
  Settings,
  Award,
  Calendar,
  DollarSign,
  ThumbsUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RecommendationItem {
  id: string;
  type: 'artisan' | 'service' | 'booking_optimization';
  title: string;
  description: string;
  confidence: number;
  reason: string;
  data: any;
  priority: 'high' | 'medium' | 'low';
  category: string;
  actionable: boolean;
  estimated_impact: string;
}

interface UserPreferences {
  preferredCategories: string[];
  preferredLocations: string[];
  budgetRange: { min: number; max: number };
  preferredTimes: string[];
  communicationStyle: 'immediate' | 'scheduled' | 'flexible';
  qualityVsPrice: 'quality' | 'balanced' | 'budget';
}

interface RecommendationEngineMetrics {
  totalRecommendations: number;
  acceptanceRate: number;
  avgConfidence: number;
  modelAccuracy: number;
  learningProgress: number;
}

export function AIRecommendationEngine() {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [metrics, setMetrics] = useState<RecommendationEngineMetrics>({
    totalRecommendations: 0,
    acceptanceRate: 0,
    avgConfidence: 0,
    modelAccuracy: 0,
    learningProgress: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [activeTab, setActiveTab] = useState('recommendations');
  const { user } = useAuth();
  const { toast } = useToast();

  // Generate AI-powered recommendations
  const generateRecommendations = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch user behavior data (using existing tables)
      const [bookingHistory, reviewHistory] = await Promise.all([
        supabase.from('bookings').select('*').eq('client_email', user.email).order('created_at', { ascending: false }).limit(50),
        supabase.from('artisan_reviews').select('*').eq('client_email', user.email).order('created_at', { ascending: false }).limit(25)
      ]);

      // Call AI recommendation engine
      const { data, error } = await supabase.functions.invoke('generate-ai-recommendations', {
        body: {
          user_id: user.id,
          booking_history: bookingHistory.data || [],
          search_history: [], // Empty for now
          review_history: reviewHistory.data || [],
          preferences: userPreferences,
          recommendation_types: ['artisan', 'service', 'booking_optimization'],
          max_recommendations: 20
        }
      });

      if (error) throw error;

      setRecommendations(data.recommendations || []);
      setMetrics(data.metrics || metrics);

    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Recommendation Error",
        description: "Failed to generate AI recommendations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, userPreferences, metrics, toast]);

  // Train the recommendation model with user feedback
  const trainModel = useCallback(async () => {
    if (!user) return;

    setIsTraining(true);
    try {
      const { data, error } = await supabase.functions.invoke('train-recommendation-model', {
        body: {
          user_id: user.id,
          feedback_data: recommendations.map(r => ({
            recommendation_id: r.id,
            user_interaction: 'viewed', // Would track actual interactions
            outcome: 'neutral' // Would track actual outcomes
          }))
        }
      });

      if (error) throw error;

      toast({
        title: "Model Training",
        description: "AI model has been updated with your preferences.",
      });

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        modelAccuracy: data.accuracy || prev.modelAccuracy,
        learningProgress: Math.min(prev.learningProgress + 5, 100)
      }));

    } catch (error) {
      console.error('Error training model:', error);
      toast({
        title: "Training Error",
        description: "Failed to update AI model. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
    }
  }, [user, recommendations, toast]);

  // Handle recommendation interaction
  const handleRecommendationAction = useCallback(async (recommendation: RecommendationItem, action: 'accept' | 'reject' | 'view') => {
    try {
      // Mock interaction logging for now
      console.log('Recommendation interaction:', {
        user_id: user?.id,
        recommendation_id: recommendation.id,
        action,
        recommendation_type: recommendation.type,
        confidence: recommendation.confidence,
        timestamp: new Date().toISOString()
      });

      // Update acceptance rate
      if (action === 'accept') {
        setMetrics(prev => ({
          ...prev,
          acceptanceRate: Math.min(prev.acceptanceRate + 1, 100)
        }));

        toast({
          title: "Recommendation Accepted",
          description: "Thanks for the feedback! This helps improve our AI.",
        });
      }

      // Handle specific actions based on recommendation type
      if (action === 'accept' && recommendation.type === 'artisan') {
        // Could navigate to artisan profile or add to favorites
        console.log('Accepting artisan recommendation:', recommendation.data);
      }

    } catch (error) {
      console.error('Error handling recommendation action:', error);
    }
  }, [user, toast]);

  // Load user preferences
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user) return;

      try {
        // Set default preferences
        const defaultPrefs: UserPreferences = {
          preferredCategories: [],
          preferredLocations: [],
          budgetRange: { min: 5000, max: 50000 },
          preferredTimes: ['morning', 'afternoon'],
          communicationStyle: 'flexible',
          qualityVsPrice: 'balanced'
        };
        setUserPreferences(defaultPrefs);
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadUserPreferences();
  }, [user]);

  // Generate recommendations on mount and preference changes
  useEffect(() => {
    if (userPreferences) {
      generateRecommendations();
    }
  }, [userPreferences, generateRecommendations]);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'artisan': return Users;
      case 'service': return Zap;
      case 'booking_optimization': return Target;
      default: return Brain;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-950';
      case 'medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'low': return 'text-green-500 bg-green-50 dark:bg-green-950';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-950';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-500" />
            AI Recommendations
          </h1>
          <p className="text-muted-foreground">
            Personalized suggestions powered by machine learning
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={trainModel}
            disabled={isTraining}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isTraining ? 'animate-spin' : ''}`} />
            {isTraining ? 'Training...' : 'Improve AI'}
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </Button>
        </div>
      </div>

      {/* AI Engine Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Recommendations</p>
                <p className="text-2xl font-bold">{metrics.totalRecommendations}</p>
              </div>
              <Brain className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Acceptance Rate</p>
                <p className="text-2xl font-bold">{metrics.acceptanceRate}%</p>
              </div>
              <ThumbsUp className="w-8 h-8 text-green-500" />
            </div>
            <Progress value={metrics.acceptanceRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Model Accuracy</p>
                <p className="text-2xl font-bold">{metrics.modelAccuracy}%</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
            <Progress value={metrics.modelAccuracy} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Learning Progress</p>
                <p className="text-2xl font-bold">{metrics.learningProgress}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
            <Progress value={metrics.learningProgress} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="artisans">Artisan Matches</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-6">
          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Learning Your Preferences</h3>
                <p className="text-muted-foreground">
                  The AI is analyzing your behavior to provide personalized recommendations.
                  Use the platform more to get better suggestions!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((recommendation) => {
                const IconComponent = getRecommendationIcon(recommendation.type);
                return (
                  <Card key={recommendation.id} className="group hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getPriorityColor(recommendation.priority)}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{recommendation.title}</h3>
                            <Badge variant="outline" className="text-xs mt-1">
                              {recommendation.category}
                            </Badge>
                          </div>
                        </div>
                        <Badge variant={recommendation.priority === 'high' ? 'destructive' : 'secondary'}>
                          {recommendation.priority}
                        </Badge>
                      </div>

                      {/* Content */}
                      <p className="text-sm text-muted-foreground mb-4">
                        {recommendation.description}
                      </p>

                      {/* Confidence & Reason */}
                      <div className="space-y-3 mb-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className="font-medium">{Math.round(recommendation.confidence * 100)}%</span>
                          </div>
                          <Progress value={recommendation.confidence * 100} className="h-2" />
                        </div>
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          <span className="font-medium">Why: </span>
                          {recommendation.reason}
                        </div>
                      </div>

                      {/* Estimated Impact */}
                      <div className="flex items-center gap-2 mb-4 text-sm">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-muted-foreground">Impact:</span>
                        <span className="font-medium">{recommendation.estimated_impact}</span>
                      </div>

                      <Separator className="my-4" />

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleRecommendationAction(recommendation, 'accept')}
                        >
                          Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRecommendationAction(recommendation, 'view')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRecommendationAction(recommendation, 'reject')}
                        >
                          Pass
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="artisans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Matched Artisans</CardTitle>
              <CardDescription>
                Artisans recommended based on your preferences and booking history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations
                  .filter(r => r.type === 'artisan')
                  .slice(0, 5)
                  .map((recommendation, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={recommendation.data?.photo_url} />
                          <AvatarFallback>{recommendation.data?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{recommendation.data?.name}</div>
                          <div className="text-sm text-muted-foreground">{recommendation.data?.category}</div>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm">{recommendation.data?.rating}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{recommendation.data?.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          {Math.round(recommendation.confidence * 100)}% match
                        </Badge>
                        <Button size="sm">View Profile</Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Optimization</CardTitle>
              <CardDescription>
                AI suggestions to improve your booking experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations
                  .filter(r => r.type === 'booking_optimization')
                  .map((recommendation, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Target className="w-6 h-6 text-blue-500" />
                          <div>
                            <div className="font-medium">{recommendation.title}</div>
                            <div className="text-sm text-muted-foreground">{recommendation.category}</div>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {recommendation.estimated_impact}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {recommendation.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {recommendation.reason}
                        </div>
                        <Button size="sm" variant="outline">
                          Apply Suggestion
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Booking Patterns</CardTitle>
                <CardDescription>
                  AI insights about your service usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Most booked category</span>
                    <Badge>Plumbing</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Preferred booking time</span>
                    <Badge variant="outline">Weekends, Morning</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average budget</span>
                    <Badge variant="outline">₦15,000 - ₦25,000</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Booking frequency</span>
                    <Badge variant="outline">2-3 times per month</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Learning Status</CardTitle>
                <CardDescription>
                  How the AI model is improving
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Preference Learning</span>
                      <span>87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Pattern Recognition</span>
                      <span>73%</span>
                    </div>
                    <Progress value={73} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Prediction Accuracy</span>
                      <span>91%</span>
                    </div>
                    <Progress value={91} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}