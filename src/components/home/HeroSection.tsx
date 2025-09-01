import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/config/routes';
import { 
  Search, 
  Shield, 
  Clock, 
  Star, 
  MapPin, 
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { serviceCategories } from '@/data/serviceCategories';

export const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Lagos');
  const navigate = useNavigate();
  const { t } = useTranslation('home');

  const popularServices = [
    'Plumbing', 'Electrical', 'House Cleaning', 'AC Repair', 
    'Generator Repair', 'Painting', 'Carpentry', 'Mobile Mechanic'
  ];

  const trustStats = [
    { label: t('hero.trustStats.artisans'), value: '5,000+', icon: Shield },
    { label: t('hero.trustStats.bookings'), value: '50,000+', icon: CheckCircle },
    { label: 'Average Response', value: '< 5 mins', icon: Clock },
    { label: t('hero.trustStats.rating'), value: '4.9/5', icon: Star }
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Background with Nigerian pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-light to-accent opacity-95"></div>
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M0 0h40v40H0V0zm20 20a20 20 0 1 1 0-40 20 20 0 0 1 0 40z'/%3E%3C/g%3E%3C/svg%3E")`,
      }}></div>

      <div className="container mx-auto px-4 py-16 md:py-24 relative">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Trust Badge */}
          <div className="flex justify-center mb-6">
            <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              Nigeria's #1 Trusted Service Platform
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {t('hero.title')}
            <br />
            <span className="text-accent">{t('hero.subtitle')}</span>
          </h1>

          <p className="text-xl md:text-2xl mb-4 text-white/90 max-w-3xl mx-auto">
            {t('hero.description')}
          </p>

          <p className="text-lg mb-12 text-white/80 max-w-2xl mx-auto">
            Nigeria's instant trust infrastructure for services. 
            <strong> Pay only when you're satisfied.</strong>
          </p>

          {/* Search Section */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl mb-12 max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* Location Selector */}
              <div className="flex items-center gap-2 bg-muted px-4 py-3 rounded-lg md:w-48">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <select 
                  value={selectedCity} 
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-transparent border-none outline-none text-foreground flex-1"
                >
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                  <option value="Benin City">Benin City</option>
                </select>
              </div>

              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder={t('hero.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base border-2 border-muted focus:border-primary text-foreground bg-background"
                />
              </div>

              <Button 
                size="lg" 
                className="px-8 h-12 bg-primary hover:bg-primary-dark text-primary-foreground" 
                onClick={() => navigate(`${ROUTES.SERVICES}?search=${encodeURIComponent(searchQuery)}&city=${encodeURIComponent(selectedCity)}`)}
              >
                <Search className="w-5 h-5 mr-2" />
                {t('hero.searchButton')}
              </Button>
            </div>

            {/* Popular Services */}
            <div className="text-left">
              <p className="text-sm text-muted-foreground mb-3">Popular services:</p>
              <div className="flex flex-wrap gap-2">
                {popularServices.map((service) => (
                  <Button
                    key={service}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setSearchQuery(service)}
                  >
                    {service}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Trust Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {trustStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-white/80">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* CTA Section */}
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <Button size="lg" variant="secondary" className="px-8" asChild>
              <Link to="/how-it-works">
                <TrendingUp className="w-5 h-5 mr-2" />
                How It Works
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 text-white border-white hover:bg-white hover:text-primary" asChild>
              <Link to="/become-artisan">
                Become an Artisan
              </Link>
            </Button>
          </div>

          {/* Trust Guarantee */}
          <div className="mt-12 p-6 bg-white/10 rounded-xl backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-3">Our Guarantee</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span>100% Verified Artisans</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span>Secure Payment Protection</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span>24/7 Customer Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};