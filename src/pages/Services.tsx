import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { serviceCategories } from '@/data/serviceCategories';
import { ROUTES } from '@/config/routes';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  Filter,
  Home,
  Building,
  User,
  Truck,
  Briefcase,
  Cog,
  ArrowRight,
  MapPin
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LocationSelector } from '@/components/ui/LocationSelector';

interface FeaturedArtisan {
  id: string;
  full_name: string;
  skill: string | null;
  city: string | null;
  photo_url: string | null;
}

const iconMap = {
  Home,
  Building,
  User,
  Truck,
  Briefcase,
  Cog
};

export default function Services() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('city') || '');
  const [featuredArtisans, setFeaturedArtisans] = useState<FeaturedArtisan[]>([]);

  useEffect(() => {
    let query = supabase
      .from('artisans')
      .select('id, full_name, skill, city, photo_url');

    if (selectedLocation) {
      query = query.ilike('city', `%${selectedLocation.split(' - ').pop()}%`);
    }

    query
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setFeaturedArtisans(data as FeaturedArtisan[]);
      });
  }, [selectedLocation]);
  
  const filteredCategories = serviceCategories.filter(category => {
    const matchesSearch = searchQuery === '' || 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.subcategories.some(sub => 
        sub.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesCategory = selectedCategory === '' || category.slug === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleServiceClick = (categorySlug: string, serviceSlug?: string) => {
    const params = new URLSearchParams();
    params.set('category', categorySlug);
    if (serviceSlug) {
      params.set('service', serviceSlug);
    }
    navigate(`/book?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary-light to-accent py-16 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Browse All Services
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                Find verified artisans for any service you need
              </p>
              
              {/* Search Bar */}
              <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-2xl mx-auto">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search for services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 text-base"
                    />
                  </div>
                  <Button size="lg" className="px-8 h-12">
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </Button>
                </div>
                <div className="mt-4">
                  <LocationSelector
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                    placeholder="Filter by area"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Filter */}
        <section className="py-8 bg-muted">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === '' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('')}
                className="rounded-full"
              >
                All Categories
              </Button>
              {serviceCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.slug ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category.slug)}
                  className="rounded-full"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Service Categories */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-16">
                <h3 className="text-2xl font-semibold mb-4">No services found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or browse all categories
                </p>
                <Button onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                }}>
                  View All Services
                </Button>
              </div>
            ) : (
              <div className="space-y-16">
                {filteredCategories.map((category) => {
                  const IconComponent = iconMap[category.iconName as keyof typeof iconMap] || Home;
                  
                  return (
                    <div key={category.id}>
                      {/* Category Header */}
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                          <IconComponent className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold">{category.name}</h2>
                          <p className="text-muted-foreground">{category.description}</p>
                          <Badge variant="outline" className="mt-2">
                            {category.subcategories.length} services available
                          </Badge>
                        </div>
                      </div>

                      {/* Services Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {category.subcategories.map((service) => (
                          <Card 
                            key={service.id}
                            className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary"
                            onClick={() => handleServiceClick(category.slug, service.slug)}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                  {service.name}
                                </h3>
                                <Badge variant="secondary" className="text-xs">
                                  ₦{service.priceRange?.min.toLocaleString()}+
                                </Badge>
                              </div>
                              
                              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                                {service.description}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  <span>Available in Lagos</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="group-hover:bg-primary group-hover:text-white transition-colors"
                                >
                                  Book Now
                                  <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Featured Verified Artisans */}
        {featuredArtisans.length > 0 && (
          <section className="py-12 bg-muted/40">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-2">Featured Artisans</h2>
              <p className="text-muted-foreground mb-8">Verified professionals ready to help</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {featuredArtisans.map((artisan) => (
                  <Card
                    key={artisan.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`${ROUTES.BOOK}?artisan=${artisan.id}`)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                        {artisan.photo_url ? (
                          <img src={artisan.photo_url} alt={artisan.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-7 h-7 text-primary" />
                        )}
                      </div>
                      <p className="font-medium text-sm leading-tight">{artisan.full_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{artisan.skill}</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{artisan.city}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Can't Find What You're Looking For?
            </h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Post your custom job request and let qualified artisans come to you with quotes.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              className="px-8"
              onClick={() => navigate(ROUTES.BOOK)}
            >
              Post a Custom Job
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}