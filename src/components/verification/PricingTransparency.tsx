import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { serviceCategories } from '@/data/serviceCategories';
import { 
  DollarSign, 
  TrendingUp, 
  Info, 
  MapPin,
  Calculator,
  Shield
} from 'lucide-react';

interface ServicePricing {
  id: string;
  service_category: string;
  service_subcategory: string;
  city: string;
  min_price: number;
  max_price: number;
  average_price: number;
  recommended_price: number;
  price_factors: any;
  last_updated: string;
}

export const PricingTransparency = () => {
  const [pricingData, setPricingData] = useState<ServicePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('Lagos');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchPricingData();
  }, [selectedCity, selectedCategory]);

  const fetchPricingData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('service_pricing')
        .select('*')
        .eq('city', selectedCity);

      if (selectedCategory) {
        query = query.eq('service_category', selectedCategory);
      }

      const { data, error } = await query.order('service_subcategory');

      if (error) throw error;
      setPricingData(data || []);
    } catch (error) {
      console.error('Error fetching pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getServiceName = (category: string, subcategory: string) => {
    const cat = serviceCategories.find(c => c.slug === category);
    const subcat = cat?.subcategories.find(s => s.slug === subcategory);
    return subcat?.name || subcategory;
  };

  const getCategoryName = (category: string) => {
    const cat = serviceCategories.find(c => c.slug === category);
    return cat?.name || category;
  };

  const cities = ['Lagos', 'Abuja', 'Benin City'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Transparent Pricing Guide
          </CardTitle>
          <CardDescription>
            Fair, transparent pricing to eliminate price gouging and build client trust
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select City</label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {city}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Filter by Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {serviceCategories.map(category => (
                    <SelectItem key={category.slug} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Benefits */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 text-green-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Why Transparent Pricing Matters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                <div>
                  <h4 className="font-medium mb-1">For Clients:</h4>
                  <ul className="space-y-1">
                    <li>• No surprises or hidden costs</li>
                    <li>• Fair market rates guaranteed</li>
                    <li>• Protection from price gouging</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-1">For Artisans:</h4>
                  <ul className="space-y-1">
                    <li>• Competitive but fair pricing</li>
                    <li>• Build client trust instantly</li>
                    <li>• Clear pricing guidelines</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Data */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading pricing data...</div>
          </CardContent>
        </Card>
      ) : pricingData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pricingData.map((pricing) => (
            <Card key={pricing.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {getServiceName(pricing.service_category, pricing.service_subcategory)}
                </CardTitle>
                <CardDescription>
                  {getCategoryName(pricing.service_category)} • {pricing.city}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Price Range */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-xs text-muted-foreground">Min Price</div>
                      <div className="font-semibold text-sm">
                        {formatPrice(pricing.min_price)}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-xs text-muted-foreground">Max Price</div>
                      <div className="font-semibold text-sm">
                        {formatPrice(pricing.max_price)}
                      </div>
                    </div>
                  </div>

                  {/* Recommended Price */}
                  <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-sm text-primary font-medium mb-1">
                      Recommended Price
                    </div>
                    <div className="text-xl font-bold text-primary">
                      {formatPrice(pricing.recommended_price)}
                    </div>
                    <Badge variant="secondary" className="mt-2">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Fair Market Rate
                    </Badge>
                  </div>

                  {/* Price Factors */}
                  {pricing.price_factors && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-2">
                        <Info className="w-4 h-4" />
                        Price Factors
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {Object.entries(pricing.price_factors as Record<string, string>).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key}:</span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last Updated */}
                  <div className="text-xs text-muted-foreground text-center">
                    Updated: {new Date(pricing.last_updated).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pricing Data Available</h3>
            <p className="text-muted-foreground mb-4">
              Pricing data for {selectedCity} {selectedCategory && `in ${getCategoryName(selectedCategory)}`} is not yet available.
            </p>
            <Button variant="outline" onClick={() => {
              setSelectedCategory('');
              setSelectedCity('Lagos');
            }}>
              View Lagos Pricing
            </Button>
          </CardContent>
        </Card>
      )}

      {/* How to Use Pricing Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            How to Use This Pricing Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">For Artisans:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Use recommended prices as your starting point</li>
                <li>• Adjust based on complexity and materials</li>
                <li>• Explain your pricing to clients clearly</li>
                <li>• Stay within the min-max range for fairness</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">For Clients:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Expect quotes within the shown ranges</li>
                <li>• Understand what affects pricing</li>
                <li>• Report suspected price gouging</li>
                <li>• Ask for detailed breakdowns</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};