import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, DollarSign, Settings, AlertCircle, Clock, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface PricingRule {
  id: string;
  name: string;
  description: string;
  category: string;
  rule_type: string;
  adjustment_value: number;
  priority: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  conditions: any;
}

interface PricingCalculation {
  id: string;
  service_category: string;
  base_price: number;
  final_price: number;
  applied_rules: any;
  calculation_factors: any;
  demand_score: number | null;
  supply_score: number | null;
  location_data: any;
  time_factors: any;
  booking_id: string | null;
  artisan_id: string | null;
  client_id: string | null;
  created_at: string;
}

interface MarketCondition {
  id: string;
  city: string;
  service_category: string;
  date: string;
  hour_of_day: number;
  demand_level: number;
  supply_level: number;
  created_at: string;
}

interface PricingAdjustment {
  id: string;
  service_category: string;
  city: string;
  adjustment_type: string;
  adjustment_value: number;
  reason: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
}

export default function DynamicPricingDashboard() {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [recentCalculations, setRecentCalculations] = useState<PricingCalculation[]>([]);
  const [marketConditions, setMarketConditions] = useState<MarketCondition[]>([]);
  const [pricingAdjustments, setPricingAdjustments] = useState<PricingAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [testPricing, setTestPricing] = useState({
    category: '',
    basePrice: '',
    city: '',
    urgency: 'normal'
  });
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [rulesRes, calculationsRes, conditionsRes, adjustmentsRes] = await Promise.all([
        supabase.from('pricing_rules').select('*').order('priority', { ascending: false }),
        supabase.from('pricing_calculations').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('market_conditions').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('pricing_adjustments').select('*').order('created_at', { ascending: false }).limit(20)
      ]);

      if (rulesRes.error) throw rulesRes.error;
      if (calculationsRes.error) throw calculationsRes.error;
      if (conditionsRes.error) throw conditionsRes.error;
      if (adjustmentsRes.error) throw adjustmentsRes.error;

      setPricingRules(rulesRes.data || []);
      setRecentCalculations(calculationsRes.data || []);
      setMarketConditions(conditionsRes.data || []);
      setPricingAdjustments(adjustmentsRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testDynamicPricing = async () => {
    if (!testPricing.category || !testPricing.basePrice || !testPricing.city) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('calculate_dynamic_price', {
        p_service_category: testPricing.category,
        p_base_price: parseFloat(testPricing.basePrice),
        p_city: testPricing.city,
        p_booking_urgency: testPricing.urgency
      });

      if (error) throw error;
      setTestResult(data);
    } catch (error) {
      console.error('Error testing pricing:', error);
      toast({
        title: "Error",
        description: "Failed to calculate dynamic pricing",
        variant: "destructive"
      });
    }
  };

  const getDemandLevelColor = (level: number) => {
    if (level >= 4) return 'bg-red-500';
    if (level >= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getDemandLevelText = (level: number) => {
    if (level >= 4) return 'High';
    if (level >= 3) return 'Normal';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dynamic Pricing Dashboard</h1>
        <Button onClick={fetchDashboardData}>Refresh Data</Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold">{pricingRules.filter(r => r.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Recent Calculations</p>
                <p className="text-2xl font-bold">{recentCalculations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-purple-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Market Conditions</p>
                <p className="text-2xl font-bold">{marketConditions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Active Adjustments</p>
                <p className="text-2xl font-bold">{pricingAdjustments.filter(a => a.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Pricing Rules</TabsTrigger>
          <TabsTrigger value="calculations">Recent Calculations</TabsTrigger>
          <TabsTrigger value="market">Market Conditions</TabsTrigger>
          <TabsTrigger value="test">Test Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Pricing Rules</h2>
            <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Pricing Rule</DialogTitle>
                  <DialogDescription>
                    Define a new pricing rule to automate price adjustments
                  </DialogDescription>
                </DialogHeader>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This is a demo interface. Full rule creation would require additional form fields and validation.
                  </AlertDescription>
                </Alert>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {pricingRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{rule.category}</Badge>
                    </div>
                  </div>
                  <CardDescription>{rule.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Type</p>
                      <p className="text-muted-foreground">{rule.rule_type}</p>
                    </div>
                    <div>
                      <p className="font-medium">Adjustment</p>
                      <p className="text-muted-foreground">{rule.adjustment_value}</p>
                    </div>
                    <div>
                      <p className="font-medium">Priority</p>
                      <p className="text-muted-foreground">{rule.priority}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calculations" className="space-y-4">
          <h2 className="text-2xl font-semibold">Recent Price Calculations</h2>
          <div className="grid gap-4">
            {recentCalculations.map((calc) => (
              <Card key={calc.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{calc.service_category}</h3>
                    <Badge variant="outline">
                      {new Date(calc.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Base Price</p>
                      <p className="text-muted-foreground">₦{calc.base_price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-medium">Final Price</p>
                      <p className="text-muted-foreground">₦{calc.final_price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-medium">Adjustment</p>
                      <p className={calc.final_price > calc.base_price ? "text-red-600" : "text-green-600"}>
                        {calc.final_price > calc.base_price ? "+" : ""}
                        {((calc.final_price - calc.base_price) / calc.base_price * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Rules Applied</p>
                      <p className="text-muted-foreground">{Array.isArray(calc.applied_rules) ? calc.applied_rules.length : 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <h2 className="text-2xl font-semibold">Market Conditions</h2>
          <div className="grid gap-4">
            {marketConditions.slice(0, 10).map((condition) => (
              <Card key={condition.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{condition.city} - {condition.service_category}</h3>
                    <Badge variant="outline">
                      {condition.hour_of_day}:00
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getDemandLevelColor(condition.demand_level)}`}></div>
                      <span className="text-sm">Demand: {getDemandLevelText(condition.demand_level)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getDemandLevelColor(condition.supply_level)}`}></div>
                      <span className="text-sm">Supply: {getDemandLevelText(condition.supply_level)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <h2 className="text-2xl font-semibold">Test Dynamic Pricing</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Service Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Plumbing"
                    value={testPricing.category}
                    onChange={(e) => setTestPricing({...testPricing, category: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Base Price (₦)</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    placeholder="5000"
                    value={testPricing.basePrice}
                    onChange={(e) => setTestPricing({...testPricing, basePrice: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Lagos"
                    value={testPricing.city}
                    onChange={(e) => setTestPricing({...testPricing, city: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency</Label>
                  <Select value={testPricing.urgency} onValueChange={(value) => setTestPricing({...testPricing, urgency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={testDynamicPricing} className="w-full">
                Calculate Dynamic Price
              </Button>

              {testResult && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Pricing Calculation Result</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">Base Price</p>
                        <p className="text-2xl">₦{testResult.base_price?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-medium">Final Price</p>
                        <p className="text-2xl font-bold text-primary">₦{testResult.final_price?.toLocaleString()}</p>
                      </div>
                    </div>
                    {testResult.savings_percentage !== 0 && (
                      <div className="mt-4">
                        <p className="font-medium">Price Change</p>
                        <p className={testResult.savings_percentage > 0 ? "text-green-600" : "text-red-600"}>
                          {testResult.savings_percentage > 0 ? "Discount: " : "Surcharge: "}
                          {Math.abs(testResult.savings_percentage)}%
                        </p>
                      </div>
                    )}
                    {testResult.applied_rules?.length > 0 && (
                      <div className="mt-4">
                        <p className="font-medium mb-2">Applied Rules</p>
                        {testResult.applied_rules.map((rule: any, index: number) => (
                          <Badge key={index} variant="outline" className="mr-2">
                            {rule.rule_name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}