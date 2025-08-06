import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
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

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm">
      {/* Trust Banner */}
      <div className="bg-primary text-primary-foreground py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>100% Verified Artisans</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Pay Only When Satisfied</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>24/7 Customer Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src={ogaJobsLogo} 
              alt="OgaJobs Logo" 
              className="w-14 h-14 object-contain"
            />
            <div>
              <h1 className="text-3xl font-bold text-foreground">OgaJobs</h1>
              <p className="text-xs text-muted-foreground font-medium">Nigeria's Trust Infrastructure</p>
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
            <Link to="/services" className="text-muted-foreground hover:text-foreground transition-colors">
              Find Services
            </Link>
            <Link to="/become-artisan" className="text-muted-foreground hover:text-foreground transition-colors">
              Become an Artisan
            </Link>
            <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
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
            {user ? (
              <>
                <NotificationCenter />
                <Button variant="ghost" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4" />
                  <span className="capitalize">{profile?.role || 'User'}</span>
                </div>
                <Button variant="outline" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth">Get Started</Link>
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
                to="/services" 
                className="text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Find Services
              </Link>
              <Link 
                to="/become-artisan" 
                className="text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Become an Artisan
              </Link>
              <Link 
                to="/how-it-works" 
                className="text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>
              
              <div className="flex items-center gap-2 py-2">
                <Badge variant="secondary" className="text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  4.9/5 Trust Score
                </Badge>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                {user ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Notifications</span>
                      <NotificationCenter />
                    </div>
                    <Button variant="ghost" asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/dashboard">Dashboard</Link>
                    </Button>
                    <div className="flex items-center gap-2 text-sm py-2">
                      <User className="w-4 h-4" />
                      <span className="capitalize">{profile?.role || 'User'}</span>
                    </div>
                    <Button variant="outline" onClick={() => { signOut(); setIsMenuOpen(false); }}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/auth">Login</Link>
                    </Button>
                    <Button asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/auth">Get Started</Link>
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