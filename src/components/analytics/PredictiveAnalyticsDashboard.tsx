import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Users,
  AlertTriangle,
  Target,
  Calendar,
  DollarSign,
  Activity,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MarketTrend {
  category: string;
  location: string;
  trend_direction: 'increasing' | 'decreasing' | 'stable';
  growth_rate: number;
  confidence: number;
  period: string;
  forecast_data: {
    current_demand: number;
    predicted_demand: number;
    market_saturation: number;
    opportunity_score: number;
  };
  key_drivers: string[];
}

interface CustomerLifetimeValue {
  segment: string;
  current_clv: number;
  predicted_clv: number;
  clv_trend: 'increasing' | 'decreasing' | 'stable';
  acquisition_cost: number;
  retention_rate: number;
  average_order_value: number;
  frequency: number;
  churn_risk: number;
  recommendations: string[];
}

interface ChurnPrediction {
  user_id: string;
  user_email: string;
  user_type: 'client' | 'artisan';
  churn_probability: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  key_indicators: string[];
  last_activity: string;
  predicted_churn_date: string;
  retention_strategies: string[];
  value_at_risk: number;
}

interface BusinessMetric {
  metric_name: string;
  current_value: number;
  predicted_value: number;
  change_percentage: number;
  trend_direction: 'up' | 'down' | 'stable';
  confidence_interval: {
    low: number;
    high: number;
  };
  factors_influencing: string[];
  forecast_period: string;
}

export default function PredictiveAnalyticsDashboard() {
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [clvAnalysis, setClvAnalysis] = useState<CustomerLifetimeValue[]>([]);
  const [churnPredictions, setChurnPredictions] = useState<ChurnPrediction[]>([]);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetric[]>([]);
  
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPredictiveData();
  }, [selectedTimeframe, selectedCategory]);

  const fetchPredictiveData = async () => {
    try {
      setLoading(true);
      
      // Fetch market trends
      const { data: trendsData, error: trendsError } = await supabase.functions.invoke('analyze-market-trends', {
        body: { 
          timeframe: selectedTimeframe,
          category: selectedCategory
        }
      });

      // Fetch churn predictions
      const { data: churnData, error: churnError } = await supabase.functions.invoke('predict-customer-churn', {
        body: { 
          risk_threshold: 0.3,
          include_recommendations: true
        }
      });

      // Fetch CLV data from database
      const { data: clvData, error: clvError } = await supabase
        .from('customer_lifetime_value')
        .select('*')
        .order('calculated_at', { ascending: false })
        .limit(20);

      // Fetch business forecasts from database
      const { data: metricsData, error: metricsError } = await supabase
        .from('business_forecasts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (trendsError) throw trendsError;
      if (clvError) throw clvError;
      if (churnError) throw churnError;
      if (metricsError) throw metricsError;

      setMarketTrends(trendsData?.trends || []);
      setClvAnalysis(clvData || []);
      setChurnPredictions(churnData?.predictions || []);
      setBusinessMetrics(metricsData || []);

    } catch (error: any) {
      console.error('Error fetching predictive data:', error);
      toast({
        title: "Error",
        description: "Failed to load predictive analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runPredictiveAnalysis = async () => {
    try {
      toast({
        title: "Running Predictive Analysis",
        description: "AI is analyzing historical data and generating forecasts...",
      });

      const { data, error } = await supabase.functions.invoke('update-predictive-models', {
        body: { 
          retrain_models: true,
          update_forecasts: true
        }
      });

      if (error) throw error;

      toast({
        title: "Analysis Complete",
        description: `Updated ${data.models_updated} predictive models`,
      });

      fetchPredictiveData();
    } catch (error: any) {
      console.error('Error running predictive analysis:', error);
      toast({
        title: "Error",
        description: "Failed to run predictive analysis",
        variant: "destructive",
      });
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing': 
      case 'up': 
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'decreasing': 
      case 'down': 
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: 
        return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const totalValueAtRisk = churnPredictions.reduce((sum, pred) => sum + pred.value_at_risk, 0);
  const highRiskUsers = churnPredictions.filter(p => p.risk_level === 'high' || p.risk_level === 'critical').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Predictive Analytics Dashboard</h1>
          <p className="text-muted-foreground">AI-powered forecasting and trend analysis</p>
        </div>
        <Button onClick={runPredictiveAnalysis} className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Run Analysis
        </Button>
      </div>

      {/* Control Panel */}
      <div className="flex gap-4 items-center">
        <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
            <SelectItem value="1y">1 Year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
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
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Value at Risk</CardTitle>
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalValueAtRisk.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From potential churn
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highRiskUsers}</div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Opportunities</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {marketTrends.filter(t => t.trend_direction === 'increasing').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Emerging market segments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg CLV</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{(clvAnalysis.reduce((sum, c) => sum + c.current_clv, 0) / clvAnalysis.length || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer lifetime value
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
          <TabsTrigger value="clv">Customer Value</TabsTrigger>
          <TabsTrigger value="churn">Churn Prevention</TabsTrigger>
          <TabsTrigger value="metrics">Business Forecasts</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Market Trend Analysis
              </CardTitle>
              <CardDescription>
                AI-identified market trends and growth opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketTrends.map((trend, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{trend.category}</h4>
                          {getTrendIcon(trend.trend_direction)}
                          <Badge variant={trend.trend_direction === 'increasing' ? 'default' : 'secondary'}>
                            {trend.growth_rate > 0 ? '+' : ''}{trend.growth_rate.toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{trend.location}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{trend.confidence}% confidence</div>
                        <div className="text-xs text-muted-foreground">{trend.period}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Current Demand</div>
                        <div className="font-medium">{trend.forecast_data.current_demand}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Predicted Demand</div>
                        <div className="font-medium">{trend.forecast_data.predicted_demand}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Market Saturation</div>
                        <Progress value={trend.forecast_data.market_saturation} className="h-2 mx-auto w-16" />
                        <div className="text-xs">{trend.forecast_data.market_saturation}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Opportunity Score</div>
                        <div className="font-medium">{trend.forecast_data.opportunity_score}/10</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Key Drivers:</div>
                      <div className="flex flex-wrap gap-1">
                        {trend.key_drivers.map((driver, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {driver}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {marketTrends.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No market trends data available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Customer Lifetime Value Analysis
              </CardTitle>
              <CardDescription>
                Predicted customer value and retention insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clvAnalysis.map((segment, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{segment.segment}</h4>
                          {getTrendIcon(segment.clv_trend)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Retention Rate: {segment.retention_rate.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-lg font-bold">₦{segment.current_clv.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Current CLV</div>
                        <div className="text-sm text-green-600">
                          Predicted: ₦{segment.predicted_clv.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Acquisition Cost</div>
                        <div className="font-medium">₦{segment.acquisition_cost.toLocaleString()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Avg Order Value</div>
                        <div className="font-medium">₦{segment.average_order_value.toLocaleString()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Frequency</div>
                        <div className="font-medium">{segment.frequency.toFixed(1)}/month</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Churn Risk</div>
                        <Progress value={segment.churn_risk} className="h-2 mx-auto w-16" />
                        <div className="text-xs">{segment.churn_risk.toFixed(0)}%</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Recommendations:</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {segment.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}

                {clvAnalysis.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No CLV analysis data available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="churn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Churn Prediction & Prevention
              </CardTitle>
              <CardDescription>
                AI-identified users at risk of churning with retention strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {churnPredictions.map((prediction) => (
                  <div key={prediction.user_id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{prediction.user_email}</h4>
                          <Badge className={getRiskColor(prediction.risk_level)}>
                            {prediction.risk_level} risk
                          </Badge>
                          <Badge variant="outline">{prediction.user_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Last activity: {new Date(prediction.last_activity).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-lg font-bold">{prediction.churn_probability.toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground">Churn probability</div>
                        <div className="text-sm text-red-600">
                          Value at risk: ₦{prediction.value_at_risk.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Risk Indicators:</div>
                      <div className="flex flex-wrap gap-1">
                        {prediction.key_indicators.map((indicator, idx) => (
                          <Badge key={idx} variant="destructive" className="text-xs">
                            {indicator}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Retention Strategies:</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {prediction.retention_strategies.map((strategy, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-600">•</span>
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Predicted churn date: {new Date(prediction.predicted_churn_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}

                {churnPredictions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No churn predictions available. All users appear to be well-engaged.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Business Metrics Forecast
              </CardTitle>
              <CardDescription>
                AI-generated forecasts for key business indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {businessMetrics.map((metric, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{metric.metric_name}</h4>
                          {getTrendIcon(metric.trend_direction)}
                          <Badge variant={metric.change_percentage > 0 ? 'default' : 'secondary'}>
                            {metric.change_percentage > 0 ? '+' : ''}{metric.change_percentage.toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{metric.forecast_period}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-lg font-bold">{metric.predicted_value.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Predicted</div>
                        <div className="text-sm">Current: {metric.current_value.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Confidence Interval:</div>
                      <div className="text-sm text-muted-foreground">
                        Low: {metric.confidence_interval.low.toLocaleString()} - 
                        High: {metric.confidence_interval.high.toLocaleString()}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Influencing Factors:</div>
                      <div className="flex flex-wrap gap-1">
                        {metric.factors_influencing.map((factor, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {businessMetrics.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No business forecasts available.
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