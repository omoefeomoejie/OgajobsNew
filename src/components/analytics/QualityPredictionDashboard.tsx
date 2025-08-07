import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QualityMetrics {
  artisan_id: string;
  artisan_name: string;
  artisan_email: string;
  predicted_rating: number;
  confidence_score: number;
  completion_probability: number;
  on_time_probability: number;
  quality_score: number;
  risk_factors: string[];
  historical_performance: {
    avg_rating: number;
    completion_rate: number;
    on_time_rate: number;
    total_jobs: number;
  };
  trend_direction: 'improving' | 'declining' | 'stable';
  last_updated: string;
}

interface QualityPrediction {
  booking_id: string;
  client_email: string;
  artisan_email: string;
  service_category: string;
  predicted_outcome: 'excellent' | 'good' | 'average' | 'poor';
  success_probability: number;
  quality_factors: {
    experience_match: number;
    skill_relevance: number;
    availability_fit: number;
    location_proximity: number;
    workload_capacity: number;
  };
  recommendations: string[];
  created_at: string;
}

interface PerformanceInsight {
  category: string;
  insight_type: 'opportunity' | 'risk' | 'trend';
  description: string;
  impact_score: number;
  actionable: boolean;
  recommendation: string;
}

export default function QualityPredictionDashboard() {
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics[]>([]);
  const [predictions, setPredictions] = useState<QualityPrediction[]>([]);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('quality_score');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchQualityData();
  }, [selectedCategory, sortBy]);

  const fetchQualityData = async () => {
    try {
      setLoading(true);
      
      // Call edge function to generate quality predictions
      const { data: predictionsData, error: predictionsError } = await supabase.functions.invoke('generate-quality-predictions', {
        body: { 
          category: selectedCategory,
          limit: 50
        }
      });

      // Fetch artisan quality metrics
      const { data: metricsData, error: metricsError } = await supabase.functions.invoke('get-quality-metrics', {
        body: { 
          sort_by: sortBy,
          category: selectedCategory
        }
      });

      // Fetch performance insights
      const { data: insightsData, error: insightsError } = await supabase.functions.invoke('generate-performance-insights', {
        body: { category: selectedCategory }
      });

      if (predictionsError) throw predictionsError;
      if (metricsError) throw metricsError;
      if (insightsError) throw insightsError;

      setQualityMetrics(metricsData?.metrics || []);
      setPredictions(predictionsData?.predictions || []);
      setInsights(insightsData?.insights || []);

    } catch (error: any) {
      console.error('Error fetching quality data:', error);
      toast({
        title: "Error",
        description: "Failed to load quality prediction data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePredictions = async () => {
    try {
      toast({
        title: "Generating Predictions",
        description: "Analyzing artisan performance data...",
      });

      const { data, error } = await supabase.functions.invoke('update-quality-predictions', {
        body: { force_update: true }
      });

      if (error) throw error;

      toast({
        title: "Predictions Updated",
        description: `Generated ${data.predictions_count} new quality predictions`,
      });

      fetchQualityData();
    } catch (error: any) {
      console.error('Error generating predictions:', error);
      toast({
        title: "Error",
        description: "Failed to generate quality predictions",
        variant: "destructive",
      });
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 75) return 'text-blue-600 bg-blue-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'average': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <CheckCircle className="w-4 h-4 text-gray-600" />;
    }
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

  const avgQualityScore = qualityMetrics.reduce((acc, m) => acc + m.quality_score, 0) / qualityMetrics.length || 0;
  const highPerformers = qualityMetrics.filter(m => m.quality_score >= 85).length;
  const riskArtisans = qualityMetrics.filter(m => m.quality_score < 60).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quality Prediction Dashboard</h1>
          <p className="text-muted-foreground">AI-powered performance forecasting and quality insights</p>
        </div>
        <Button onClick={generatePredictions} className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Update Predictions
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Quality Score</CardTitle>
            <Award className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgQualityScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Based on {qualityMetrics.length} artisans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Performers</CardTitle>
            <Star className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPerformers}</div>
            <p className="text-xs text-muted-foreground">
              Quality score ≥ 85%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riskArtisans}</div>
            <p className="text-xs text-muted-foreground">
              Quality score &lt; 60%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="plumbing">Plumbing</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="cleaning">Cleaning</SelectItem>
            <SelectItem value="painting">Painting</SelectItem>
            <SelectItem value="carpentry">Carpentry</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quality_score">Quality Score</SelectItem>
            <SelectItem value="predicted_rating">Predicted Rating</SelectItem>
            <SelectItem value="completion_probability">Completion Rate</SelectItem>
            <SelectItem value="confidence_score">Confidence</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Quality Metrics</TabsTrigger>
          <TabsTrigger value="predictions">Job Predictions</TabsTrigger>
          <TabsTrigger value="insights">Performance Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Artisan Quality Metrics</CardTitle>
              <CardDescription>
                AI-generated quality scores and performance predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qualityMetrics.map((metric) => (
                  <div key={metric.artisan_id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{metric.artisan_name}</h4>
                          {getTrendIcon(metric.trend_direction)}
                          <Badge className={getQualityColor(metric.quality_score)}>
                            {metric.quality_score.toFixed(1)}% Quality
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{metric.artisan_email}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-sm font-medium">
                          Predicted Rating: {metric.predicted_rating.toFixed(1)}/5.0
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {metric.confidence_score.toFixed(0)}% confidence
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Completion Rate</div>
                        <div className="font-medium">{metric.completion_probability.toFixed(1)}%</div>
                        <Progress value={metric.completion_probability} className="h-1" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">On-Time Rate</div>
                        <div className="font-medium">{metric.on_time_probability.toFixed(1)}%</div>
                        <Progress value={metric.on_time_probability} className="h-1" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Historical Avg</div>
                        <div className="font-medium">{metric.historical_performance.avg_rating.toFixed(1)}/5.0</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Total Jobs</div>
                        <div className="font-medium">{metric.historical_performance.total_jobs}</div>
                      </div>
                    </div>

                    {metric.risk_factors.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-orange-600">Risk Factors:</div>
                        <div className="flex flex-wrap gap-1">
                          {metric.risk_factors.map((factor, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {qualityMetrics.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No quality metrics available. Run quality analysis to generate predictions.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Outcome Predictions</CardTitle>
              <CardDescription>
                AI predictions for current and upcoming bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.map((prediction) => (
                  <div key={prediction.booking_id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getOutcomeColor(prediction.predicted_outcome)}>
                            {prediction.predicted_outcome}
                          </Badge>
                          <span className="text-sm font-medium">{prediction.service_category}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {prediction.client_email} → {prediction.artisan_email}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{prediction.success_probability.toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground">Success probability</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Experience</div>
                        <div className="font-medium">{prediction.quality_factors.experience_match}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Skills</div>
                        <div className="font-medium">{prediction.quality_factors.skill_relevance}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Availability</div>
                        <div className="font-medium">{prediction.quality_factors.availability_fit}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Location</div>
                        <div className="font-medium">{prediction.quality_factors.location_proximity}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Workload</div>
                        <div className="font-medium">{prediction.quality_factors.workload_capacity}%</div>
                      </div>
                    </div>

                    {prediction.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Recommendations:</div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {prediction.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-600">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}

                {predictions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No job predictions available. Generate new predictions to see forecasts.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>
                AI-generated insights and improvement opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            insight.insight_type === 'opportunity' ? 'default' :
                            insight.insight_type === 'risk' ? 'destructive' : 'secondary'
                          }>
                            {insight.insight_type}
                          </Badge>
                          <span className="font-medium">{insight.category}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">Impact: {insight.impact_score}/10</div>
                        {insight.actionable && (
                          <Badge variant="outline" className="text-xs mt-1">Actionable</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 rounded p-3">
                      <div className="text-sm font-medium mb-1">Recommendation:</div>
                      <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                    </div>
                  </div>
                ))}

                {insights.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No performance insights available. Generate insights to see recommendations.
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