import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Star, 
  MapPin, 
  Clock, 
  Award, 
  Phone, 
  Mail, 
  Calendar,
  CheckCircle,
  DollarSign,
  Eye,
  Heart,
  Share2,
  MessageCircle
} from 'lucide-react';

interface Portfolio {
  id: string;
  artisan_id?: string;
  title: string;
  bio: string;
  specialties: string[];
  years_experience: number;
  hourly_rate: number;
  profile_image_url: string;
  cover_image_url: string;
  location: any;
  availability_status: string;
  portfolio_views: number;
}

interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  category: string;
  before_image_url: string;
  after_image_url: string;
  completion_date: string;
  client_name: string;
  project_duration: string;
  materials_used: string[];
  project_cost: number;
  is_featured: boolean;
}

interface ServicePackage {
  id: string;
  package_name: string;
  description: string;
  price: number;
  duration: string;
  includes: string[];
  category: string;
  is_popular: boolean;
}

interface Testimonial {
  id: string;
  client_name: string;
  client_avatar_url: string;
  testimonial: string;
  rating: number;
  project_title: string;
  completion_date: string;
  is_featured: boolean;
}

export function PortfolioViewer() {
  const { portfolioId } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (portfolioId) {
      loadPortfolioData();
      incrementViewCount();
    }
  }, [portfolioId]);

  const loadPortfolioData = async () => {
    try {
      // Load portfolio
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('id', portfolioId)
        .eq('is_public', true)
        .single();

      if (portfolioError) throw portfolioError;
      setPortfolio(portfolioData);

      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('portfolio_projects')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('display_order', { ascending: true });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Load packages
      const { data: packagesData, error: packagesError } = await supabase
        .from('service_packages')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('display_order', { ascending: true });

      if (packagesError) throw packagesError;
      setPackages(packagesData || []);

      // Load testimonials
      const { data: testimonialsData, error: testimonialsError } = await supabase
        .from('portfolio_testimonials')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (testimonialsError) throw testimonialsError;
      setTestimonials(testimonialsData || []);

    } catch (error: any) {
      console.error('Error loading portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to load portfolio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      await supabase.rpc('increment_portfolio_views', {
        portfolio_id_param: portfolioId
      });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleContact = () => {
    navigate(`/messages?artisan=${portfolioId}`);
  };

  const handleBooking = (packageId?: string) => {
    if (packageId) {
      navigate(`/book?portfolio=${portfolioId}&package=${packageId}`);
    } else {
      navigate(`/book?portfolio=${portfolioId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse">
          <div className="h-64 bg-muted"></div>
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 bg-muted rounded-lg"></div>
                ))}
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-muted rounded-lg"></div>
                <div className="h-48 bg-muted rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Portfolio Not Found</h1>
          <p className="text-muted-foreground">This portfolio may be private or doesn't exist.</p>
        </div>
      </div>
    );
  }

  const averageRating = testimonials.length > 0 
    ? testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-64 bg-gradient-to-r from-primary/20 to-blue-500/20">
        {portfolio.cover_image_url && (
          <img 
            src={portfolio.cover_image_url} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={portfolio.profile_image_url} />
                    <AvatarFallback className="text-lg">
                      {portfolio.title.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-2xl font-bold">{portfolio.title}</h1>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          {averageRating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{averageRating.toFixed(1)}</span>
                              <span>({testimonials.length} reviews)</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{portfolio.years_experience} years experience</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{portfolio.portfolio_views} views</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="mt-4 text-muted-foreground">{portfolio.bio}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      {(portfolio.specialties || []).map((specialty, index) => (
                        <Badge key={index} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Tabs */}
            <Tabs defaultValue="projects" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
                <TabsTrigger value="packages">Packages ({packages.length})</TabsTrigger>
                <TabsTrigger value="reviews">Reviews ({testimonials.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="projects" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(projects || []).map((project) => (
                    <Card key={project.id}>
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        <Award className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium">{project.title}</h3>
                          {project.is_featured && (
                            <Badge variant="default" className="text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs mb-2">
                          {project.category}
                        </Badge>
                        <p className="text-sm text-muted-foreground mb-2">
                          {project.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Client: {project.client_name}</span>
                          <span>₦{project.project_cost?.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(project.completion_date).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {projects.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="w-12 h-12 mx-auto mb-4" />
                    <p>No projects to display yet.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="packages" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(packages || []).map((pkg) => (
                    <Card key={pkg.id} className={`relative ${pkg.is_popular ? 'ring-2 ring-primary' : ''}`}>
                      {pkg.is_popular && (
                        <Badge className="absolute -top-2 left-4 bg-primary">
                          Most Popular
                        </Badge>
                      )}
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{pkg.package_name}</span>
                          <span className="text-2xl font-bold text-primary">
                            ₦{pkg.price.toLocaleString()}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {pkg.description}
                        </p>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>{pkg.duration}</span>
                          </div>
                          <div className="space-y-1">
                            {pkg.includes.map((item, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button 
                          className="w-full"
                          onClick={() => handleBooking(pkg.id)}
                        >
                          Book This Package
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {packages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-4" />
                    <p>No service packages available.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                {(testimonials || []).map((testimonial) => (
                  <Card key={testimonial.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={testimonial.client_avatar_url} />
                          <AvatarFallback>
                            {testimonial.client_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{testimonial.client_name}</h4>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: testimonial.rating }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {testimonial.testimonial}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            Project: {testimonial.project_title} • {new Date(testimonial.completion_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {testimonials.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="w-12 h-12 mx-auto mb-4" />
                    <p>No reviews yet.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle>Contact & Booking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">
                    ₦{portfolio.hourly_rate.toLocaleString()}/hr
                  </div>
                  <div className="text-sm text-muted-foreground">Starting rate</div>
                </div>
                
                <div className="space-y-2">
                  <Badge 
                    variant={portfolio.availability_status === 'available' ? 'default' : 'secondary'}
                    className="w-full justify-center"
                  >
                    {portfolio.availability_status === 'available' ? 'Available Now' : 'Currently Busy'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    className="w-full"
                    onClick={() => handleBooking()}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Now
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleContact}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleContact}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Response Time</span>
                  <span className="text-sm font-medium">Varies</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Projects Completed</span>
                  <span className="text-sm font-medium">{projects.length}+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Client Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {averageRating > 0 ? averageRating.toFixed(1) : 'No reviews yet'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Profile Views</span>
                  <span className="text-sm font-medium">{portfolio.portfolio_views}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}