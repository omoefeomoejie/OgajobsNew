import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMobile } from '@/hooks/useMobile';
import { Badge } from '@/components/ui/badge';
import { getMobileNavItems } from '@/config/routes';
import {
  Home,
  Search,
  Calendar,
  MessageSquare,
  User,
  Briefcase,
  Star,
  Settings,
  Shield
} from 'lucide-react';

const iconMap = {
  Home,
  Search,
  Calendar: Calendar,
  MessageSquare,
  User,
  Briefcase,
  Star,
  Settings,
  Shield
};

export function MobileBottomNav() {
  const { user, profile } = useAuth();
  const { isMobile } = useMobile();
  const location = useLocation();

  if (!isMobile || !user) return null;

  const navigationItems = getMobileNavItems(profile?.role).map(item => ({
    ...item,
    icon: iconMap[item.icon as keyof typeof iconMap] || Home
  }));

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
              
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}