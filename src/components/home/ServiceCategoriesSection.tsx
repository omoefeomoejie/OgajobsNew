import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { serviceCategories } from '@/data/serviceCategories';
import { ROUTES } from '@/config/routes';
import { 
  Home, 
  Building, 
  User, 
  Truck, 
  Briefcase, 
  Star, 
  Cog,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const iconMap = {
  Home,
  Building,
  User,
  Truck,
  Briefcase,
  Star,
  Cog
};

const iconColorClasses = [
  'bg-green-100 text-green-700 group-hover:bg-green-600 group-hover:text-white',
  'bg-orange-100 text-orange-700 group-hover:bg-orange-600 group-hover:text-white',
  'bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white',
  'bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white',
  'bg-red-100 text-red-700 group-hover:bg-red-600 group-hover:text-white',
  'bg-yellow-100 text-yellow-700 group-hover:bg-yellow-600 group-hover:text-white',
];

export const ServiceCategoriesSection = () => {
  const prioritizedCategories = serviceCategories.sort((a, b) => a.priority - b.priority);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <TrendingUp className="w-4 h-4 mr-2" />
            Most Requested Services
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Every Service You Need,
            <br />
            <span className="text-primary">One Trusted Platform</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From construction to personal services, we have thousands of verified artisans 
            ready to help you. No more searching through contacts or worrying about quality.
          </p>
        </div>

        {/* Service Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {prioritizedCategories.map((category, index) => {
            const IconComponent = iconMap[category.iconName as keyof typeof iconMap] || Home;
            const colorCls = iconColorClasses[index % iconColorClasses.length];
            const topServices = category.subcategories.slice(0, 3);
            
            return (
              <Card 
                key={category.id} 
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary"
              >
                <CardContent className="p-6">
                  {/* Category Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${colorCls}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {category.subcategories.length} services
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {category.description}
                  </p>

                  {/* Top Services */}
                  <div className="space-y-2 mb-4">
                    {topServices.map((service) => (
                      <div key={service.id} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{service.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ₦{service.priceRange?.min.toLocaleString()}+
                        </span>
                      </div>
                    ))}
                    {category.subcategories.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{category.subcategories.length - 3} more services
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button 
                    variant="ghost" 
                    className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                    asChild
                  >
                    <Link to={`${ROUTES.SERVICES}?category=${category.slug}`}>
                      View Services
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* View All Services CTA */}
        <div className="text-center">
          <Button size="lg" className="px-8" asChild>
            <Link to={ROUTES.SERVICES}>
              View All Services
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
          <p className="text-muted-foreground mt-4">
            Over {serviceCategories.reduce((total, cat) => total + cat.subcategories.length, 0)} specialized services available
          </p>
        </div>

        {/* Featured Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">Growing</div>
            <div className="text-muted-foreground">Verified Artisans</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">Secure</div>
            <div className="text-muted-foreground">Escrow Payments</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">Vetted</div>
            <div className="text-muted-foreground">Every Artisan</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">24/7</div>
            <div className="text-muted-foreground">Customer Support</div>
          </div>
        </div>
      </div>
    </section>
  );
};