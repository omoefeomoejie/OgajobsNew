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
import ogaJobsLogo from '/lovable-uploads/74a2fa1b-09a7-4b4d-a017-2e43655ecc11.png';

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
          <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity flex-shrink-0">
            <img 
              src={ogaJobsLogo}
              alt="OgaJobs Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain aspect-square bg-transparent"
              style={{ background: 'transparent' }}
            />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-foreground tracking-tight">
                OgaJobs
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold truncate">
                Nigeria's Trust Infrastructure
              </p>
            </div>
          </Link>

          {/* Desktop Navigation - Better Responsive Handling */}
          <div className="hidden xl:flex items-center gap-4 flex-1 justify-center">
            {!user && (
              <>
                {/* Location Selector */}
                <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-lg">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <select className="bg-transparent border-none outline-none text-xs min-w-0">
                    <option>Lagos</option>
                    <option>Abuja</option>
                  </select>
                </div>

                {/* Navigation Links */}
                <nav className="flex items-center gap-3">
                  <Link to="/all-services" className="text-muted-foreground hover:text-foreground transition-colors text-sm whitespace-nowrap">
                    Find Services
                  </Link>
                  <Link to="/become-artisan" className="text-muted-foreground hover:text-foreground transition-colors text-sm whitespace-nowrap">
                    Become Artisan
                  </Link>
                  <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm whitespace-nowrap">
                    How It Works
                  </Link>
                  <Badge variant="secondary" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    4.9/5
                  </Badge>
                </nav>
              </>
            )}

            {/* User Role Indicator - Authenticated Users */}
            {user && profile?.role && (
              <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {profile.role === 'client' ? 'Client Portal' : 
                   profile.role === 'artisan' ? 'Artisan Hub' : 
                   profile.role === 'admin' ? 'Admin Panel' : 
                   'User Account'}
                </span>
              </div>
            )}
          </div>

          {/* Right Section - Auth & Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Language Selector - Always Visible */}
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <NotificationCenter />
                  {(profile?.role === 'admin' || profile?.role === 'super_admin') ? (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/admin-dashboard">Admin</Link>
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/dashboard">Dashboard</Link>
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/auth">Login</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/auth">Get Started</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button - Improved */}
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

              {/* Location Selector - Mobile */}
              {!user && (
                <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <select className="bg-transparent border-none outline-none text-sm flex-1">
                    <option>Lagos</option>
                    <option>Abuja</option>
                    <option>Benin City</option>
                  </select>
                </div>
              )}
              
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