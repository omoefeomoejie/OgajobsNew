import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { LanguageSelector } from './LanguageSelector';
import { 
  Shield, 
  Phone, 
  Menu, 
  X, 
  MapPin,
  Clock,
  Star,
  User,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/ui/logo';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, loading } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm">
      {/* Trust Banner - Responsive */}
      <div className="bg-primary text-primary-foreground py-1.5 sm:py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 sm:gap-4 lg:gap-6 text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t('trust.verifiedArtisans')}</span>
              <span className="sm:hidden">Verified</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Pay Only When Satisfied</span>
              <span className="sm:hidden">Secure Pay</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t('trust.support247')}</span>
              <span className="sm:hidden">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header - Improved Layout */}
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Responsive Sizing */}
          <Link to="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <Logo 
                variant="full"
                size="sm"
                className="sm:hidden"
              />
              <Logo 
                variant="full"
                size="md"
                className="hidden sm:flex md:hidden"
              />
              <Logo 
                variant="full"
                size="lg"
                className="hidden md:flex"
              />
            </div>
          </Link>

          {/* Desktop Navigation - Always Visible - Responsive Design */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6 flex-1 justify-center mx-4">
            {/* Navigation Links - Responsive Display */}
            <nav className="flex items-center gap-4 lg:gap-8">
              <Link to="/all-services" className="text-foreground hover:text-primary transition-colors font-medium text-sm lg:text-base whitespace-nowrap">
                Find Services
              </Link>
              <Link to="/become-artisan" className="text-foreground hover:text-primary transition-colors font-medium text-sm lg:text-base whitespace-nowrap">
                Become an Artisan
              </Link>
              <Link to="/how-it-works" className="text-foreground hover:text-primary transition-colors font-medium text-sm lg:text-base whitespace-nowrap">
                How It Works
              </Link>
            </nav>

            {/* Trust Score Badge - Responsive */}
            <div className="hidden lg:flex items-center gap-2 bg-green-50 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full border border-green-200">
              <Star className="w-3 h-3 lg:w-4 lg:h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-xs lg:text-sm font-medium text-green-700 whitespace-nowrap">4.9/5 Trust Score</span>
            </div>
          </div>

          {/* Right Section - Location, Language, Auth */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Location Selector - Responsive */}
            <div className="hidden lg:flex items-center gap-1 bg-muted px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg">
              <MapPin className="w-3 h-3 lg:w-4 lg:h-4 text-muted-foreground" />
              <select className="bg-transparent border-none outline-none text-xs lg:text-sm min-w-0">
                <option>Lagos</option>
                <option>Abuja</option>
                <option>Port Harcourt</option>
                <option>Kano</option>
              </select>
            </div>

            {/* Language Selector - Responsive */}
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>

            {/* User Role Indicator - Authenticated Users */}
            {user && profile?.role && (
              <div className="hidden xl:flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary capitalize">
                  {profile.role}
                </span>
              </div>
            )}

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <NotificationCenter />
                  {(profile?.role === 'admin' || profile?.role === 'super_admin') ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/admin-dashboard">Admin</Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/dashboard">Dashboard</Link>
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/auth">Login</Link>
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" asChild>
                    <Link to="/auth">Get Started</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button - Responsive */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-border">
            <nav className="space-y-4">
              {/* User Role Indicator - Mobile */}
              {user && profile?.role && (
                <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {profile.role === 'client' ? 'Client Portal' : 
                     profile.role === 'artisan' ? 'Artisan Hub' : 
                     profile.role === 'admin' ? 'Admin Panel' : 
                     'User Account'}
                  </span>
                </div>
              )}

              {/* Location Selector - Mobile (Always Visible) */}
              <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <select className="bg-transparent border-none outline-none text-sm flex-1">
                  <option>Lagos</option>
                  <option>Abuja</option>
                  <option>Benin City</option>
                </select>
              </div>
              
              {/* Navigation Links - Mobile */}
              <div className="space-y-2">
                <Link 
                  to="/all-services" 
                  className="block text-muted-foreground hover:text-foreground transition-colors py-2 px-2 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Find Services
                </Link>
                <Link 
                  to="/become-artisan" 
                  className="block text-muted-foreground hover:text-foreground transition-colors py-2 px-2 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Become Artisan
                </Link>
                <Link 
                  to="/how-it-works" 
                  className="block text-muted-foreground hover:text-foreground transition-colors py-2 px-2 rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  How It Works
                </Link>
                
                <div className="flex items-center gap-2 py-2 px-2">
                  <Badge variant="secondary" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    4.9/5 Trust Score
                  </Badge>
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="sm:hidden">
                  <LanguageSelector />
                </div>
                
                {user ? (
                  <>
                    <div className="w-full">
                      <NotificationCenter />
                    </div>
                    {(profile?.role === 'admin' || profile?.role === 'super_admin') ? (
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start" 
                        asChild 
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Link to="/admin-dashboard">Admin Dashboard</Link>
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start" 
                        asChild 
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Link to="/dashboard">Dashboard</Link>
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <Button 
                      variant="ghost" 
                      className="w-full" 
                      asChild 
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Link to="/auth">Login</Link>
                    </Button>
                    <Button 
                      className="w-full" 
                      asChild 
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Link to="/auth">Get Started</Link>
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};