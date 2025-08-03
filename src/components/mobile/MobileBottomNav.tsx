import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMobile } from '@/hooks/useMobile';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Search,
  Calendar,
  MessageSquare,
  User,
  Briefcase,
  Star,
  Settings
} from 'lucide-react';

export function MobileBottomNav() {
  const { profile } = useAuth();
  const { isMobile } = useMobile();
  const location = useLocation();

  if (!isMobile) return null;

  const getNavigationItems = () => {
    const commonItems = [
      { title: 'Home', url: '/dashboard', icon: Home },
      { title: 'Messages', url: '/messages', icon: MessageSquare },
    ];

    if (profile?.role === 'client') {
      return [
        ...commonItems,
        { title: 'Find', url: '/services', icon: Search },
        { title: 'Bookings', url: '/bookings', icon: Calendar },
        { title: 'Profile', url: '/profile', icon: User },
      ];
    }

    if (profile?.role === 'artisan') {
      return [
        ...commonItems,
        { title: 'Jobs', url: '/jobs', icon: Briefcase },
        { title: 'Reviews', url: '/reviews', icon: Star },
        { title: 'Profile', url: '/profile', icon: User },
      ];
    }

    // Admin items
    return [
      ...commonItems,
      { title: 'Settings', url: '/settings', icon: Settings },
      { title: 'Admin', url: '/ojssytem-admin', icon: User },
    ];
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border z-40 safe-area-pb">
      <div className="grid grid-cols-5 h-16">
        {navigationItems.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={`flex flex-col items-center justify-center gap-1 relative transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-xs font-medium">{item.title}</span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
              
              {/* Message badge example */}
              {item.url === '/messages' && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  3
                </Badge>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}