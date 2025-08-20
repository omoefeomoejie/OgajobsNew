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
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ogaJobsLogo from '@/assets/ogajobs-new-logo.png';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, signOut, loading } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm">
      {/* Trust Banner */}
      <div className="bg-primary text-primary-foreground py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>{t('trust.verifiedArtisans')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Pay Only When Satisfied</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{t('trust.support247')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img 
              src="/lovable-uploads/13d79441-e3cc-4b39-8c69-2739fa495b9e.png" 
              alt="OgaJobs Logo" 
              className="w-20 h-20 object-contain filter drop-shadow-lg"
              style={{ background: 'transparent', imageRendering: 'crisp-edges' }}
            />
            <div>
              <h1 className="text-4xl font-black text-foreground tracking-tight">OgaJobs</h1>
              <p className="text-sm text-muted-foreground font-semibold">Nigeria's Trust Infrastructure</p>
            </div>
          </Link>

          {/* Location Selector */}
          <div className="hidden md:flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <select className="bg-transparent border-none outline-none text-sm">
              <option>Lagos</option>
              <option>Abuja</option>
              <option>Benin City</option>
            </select>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/all-services" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('navigation.findServices')}
            </Link>
            <Link to="/become-artisan" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('navigation.becomeArtisan')}
            </Link>
            <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('navigation.howItWorks')}
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Star className="w-3 h-3 mr-1" />
                4.9/5 Trust Score
              </Badge>
            </div>
          </nav>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector />
            {user ? (
              <>
                <NotificationCenter />
                <Button variant="ghost" asChild>
                  <Link to="/dashboard">{t('navigation.dashboard')}</Link>
                </Button>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4" />
                  <span className="capitalize">{profile?.role || 'User'}</span>
                </div>
                {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                  <Button variant="ghost" asChild>
                    <Link to="/admin-dashboard">Admin</Link>
                  </Button>
                )}
                <Button variant="outline" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('navigation.signOut')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">{t('navigation.login')}</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth">{t('navigation.getStarted')}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg mb-4">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <select className="bg-transparent border-none outline-none text-sm flex-1">
                  <option>Lagos</option>
                  <option>Abuja</option>
                  <option>Benin City</option>
                </select>
              </div>
              
              <Link 
                to="/all-services" 
                className="text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.findServices')}
              </Link>
              <Link 
                to="/become-artisan" 
                className="text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.becomeArtisan')}
              </Link>
              <Link 
                to="/how-it-works" 
                className="text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.howItWorks')}
              </Link>
              
              <div className="flex items-center gap-2 py-2">
                <Badge variant="secondary" className="text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  4.9/5 Trust Score
                </Badge>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <LanguageSelector />
                {user ? (
                  <>
                    <NotificationCenter />
                    <Button variant="ghost" asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/dashboard">{t('navigation.dashboard')}</Link>
                    </Button>
                    <div className="flex items-center gap-2 text-sm py-2">
                      <User className="w-4 h-4" />
                      <span className="capitalize">{profile?.role || 'User'}</span>
                    </div>
                    {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                      <Button variant="ghost" asChild onClick={() => setIsMenuOpen(false)}>
                        <Link to="/admin-dashboard">Admin</Link>
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => { signOut(); setIsMenuOpen(false); }}>
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('navigation.signOut')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/auth">{t('navigation.login')}</Link>
                    </Button>
                    <Button asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/auth">{t('navigation.getStarted')}</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};