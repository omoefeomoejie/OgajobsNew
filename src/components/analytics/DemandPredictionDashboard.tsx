import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Brain, TrendingUp, Calendar, MapPin, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DemandPrediction {
  id: string;
  prediction_date: string;
  city: string;
  category: string;
  predicted_demand: number;
  confidence_score: number;
  historical_avg: number;
  trend_factor: number;
  created_at: string;
}

interface DemandAnalytics {
  date: string;
  city: string;
  category: string;
  booking_count: number;
  average_budget: number;
}

export function DemandPredictionDashboard() {
  const [predictions, setPredictions] = useState<DemandPrediction[]>([]);
  const [analytics, setAnalytics] = useState<DemandAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch predictions
      const { data: predictionsData, error: predictionsError } = await supabase
        .from('demand_predictions')
        .select('*')
        .gte('prediction_date', new Date().toISOString().split('T')[0])
        .order('prediction_date', { ascending: true });

      if (predictionsError) throw predictionsError;

      // Fetch historical analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('demand_analytics')
        .select('*')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (analyticsError) throw analyticsError;

      setPredictions(predictionsData || []);
      setAnalytics(analyticsData || []);
    } catch (error) {
      console.error('Error fetching demand data:', error);
      toast({
        title: "Error",
        description: "Failed to load demand prediction data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePredictions = async () => {
    try {
      setGenerating(true);
      
      const { error } = await supabase.functions.invoke('generate-demand-predictions');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Demand predictions generated successfully"
      });
      
      await fetchData();
    } catch (error) {
      console.error('Error generating predictions:', error);
      toast({
        title: "Error",
        description: "Failed to generate predictions",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-success text-success-foreground';
    if (confidence >= 0.6) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  // Group predictions by city for visualization
  const predictionsByCity = predictions.reduce((acc, pred) => {
    if (!acc[pred.city]) acc[pred.city] = [];
    acc[pred.city].push(pred);
    return acc;
  }, {} as Record<string, DemandPrediction[]>);

  // Prepare chart data
  const chartData = predictions.slice(0, 7).map(pred => ({
    date: new Date(pred.prediction_date).toLocaleDateString(),
    predicted: pred.predicted_demand,
    confidence: pred.confidence_score * 100,
    city: pred.city,
    category: pred.category
  }));

  if (loading) {
    return <div className="flex justify-center p-8">Loading demand predictions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Demand Prediction Dashboard
          </h2>
          <p className="text-muted-foreground">AI-powered demand forecasting and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={generatePredictions} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Predictions'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{predictions.length}</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {predictions.length > 0 
                ? `${Math.round(predictions.reduce((sum, p) => sum + p.confidence_score, 0) / predictions.length * 100)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">Prediction accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Demand Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {predictions.filter(p => p.predicted_demand >= 10).length}
            </div>
            <p className="text-xs text-muted-foreground">Expected busy days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cities Covered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(predictions.map(p => p.city)).size}
            </div>
            <p className="text-xs text-muted-foreground">Active markets</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="forecast" className="space-y-4">
        <TabsList>
          <TabsTrigger value="forecast">Demand Forecast</TabsTrigger>
          <TabsTrigger value="cities">By City</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>7-Day Demand Forecast</CardTitle>
              <CardDescription>Predicted booking demand with confidence levels</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => `Date: ${label}`}
                    formatter={(value, name) => [
                      name === 'predicted' ? `${value} bookings` : `${value}%`,
                      name === 'predicted' ? 'Predicted Demand' : 'Confidence'
                    ]}
                  />
                  <Line type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="confidence" stroke="hsl(var(--secondary))" strokeWidth={1} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.slice(0, 6).map((prediction) => (
              <Card key={prediction.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {new Date(prediction.prediction_date).toLocaleDateString()}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {prediction.city} • {prediction.category}
                      </CardDescription>
                    </div>
                    <Badge className={getConfidenceColor(prediction.confidence_score)}>
                      {getConfidenceLabel(prediction.confidence_score)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Predicted Demand:</span>
                      <span className="font-semibold">{prediction.predicted_demand} bookings</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Confidence:</span>
                      <span className="font-semibold">{Math.round(prediction.confidence_score * 100)}%</span>
                    </div>
                    {prediction.historical_avg && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Historical Avg:</span>
                        <span className="font-semibold">{Math.round(prediction.historical_avg)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cities">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(predictionsByCity).map(([city, cityPredictions]) => (
              <Card key={city}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {city}
                  </CardTitle>
                  <CardDescription>{cityPredictions.length} predictions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={cityPredictions.slice(0, 7)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="prediction_date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        formatter={(value) => [`${value} bookings`, 'Predicted Demand']}
                      />
                      <Bar dataKey="predicted_demand" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Demand by Service Category</CardTitle>
              <CardDescription>Predicted demand across different service types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from(new Set(predictions.map(p => p.category))).map(category => {
                  const categoryPredictions = predictions.filter(p => p.category === category);
                  const totalDemand = categoryPredictions.reduce((sum, p) => sum + p.predicted_demand, 0);
                  const avgConfidence = categoryPredictions.reduce((sum, p) => sum + p.confidence_score, 0) / categoryPredictions.length;
                  
                  return (
                    <div key={category} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{category}</h4>
                        <p className="text-sm text-muted-foreground">{categoryPredictions.length} predictions</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{totalDemand} total bookings</div>
                        <Badge className={getConfidenceColor(avgConfidence)}>
                          {Math.round(avgConfidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Historical vs Predicted Trends
              </CardTitle>
              <CardDescription>Compare historical data with AI predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="booking_count" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5"
                    name="Historical"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted_demand" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Predicted"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {predictions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Predictions Available</h3>
            <p className="text-muted-foreground text-center mb-4">
              Generate demand predictions to see AI-powered forecasts for your platform.
            </p>
            <Button onClick={generatePredictions} disabled={generating}>
              {generating ? 'Generating...' : 'Generate First Predictions'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}