import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { getMobileNavItems } from '@/config/routes';
import { RESPONSIVE_GRIDS } from '@/utils/responsive';
import { cn } from '@/lib/utils';
import {
  Home,
  Search,
  Calendar,
  MessageSquare,
  User,
  Briefcase,
  Star,
  Settings,
  Shield,
  Menu,
  X,
  Plus
} from 'lucide-react';

const iconMap = {
  Home,
  Search,
  Calendar,
  MessageSquare,
  User,
  Briefcase,
  Star,
  Settings,
  Shield,
  Menu,
  Plus
};

interface EnhancedMobileNavProps {
  className?: string;
}

export function EnhancedMobileNav({ className }: EnhancedMobileNavProps) {
  const { user, profile } = useAuth();
  const { isMobile } = useResponsive();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!isMobile || !user) return null;

  const navigationItems = getMobileNavItems(profile?.role).map(item => ({
    ...item,
    icon: iconMap[item.icon as keyof typeof iconMap] || Home
  }));

  const primaryItems = navigationItems.slice(0, 4);
  const secondaryItems = navigationItems.slice(4);

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-40',
      'safe-area-pb',
      className
    )}>
      <div className="px-2 py-1">
        {/* Primary Navigation */}
        <div className="grid grid-cols-5 h-14">
          {primaryItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <NavLink
                key={item.url}
                to={item.url}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 relative transition-all duration-200',
                  'hover:bg-muted/50 rounded-lg mx-1 py-2',
                  isActive 
                    ? 'text-primary scale-105' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className={cn(
                  'transition-transform',
                  isActive ? 'h-5 w-5' : 'h-4 w-4'
                )} />
                <span className={cn(
                  'font-medium transition-all',
                  isActive ? 'text-xs' : 'text-xs opacity-80'
                )}>
                  {item.title}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
                
                {/* Notification badges */}
                {item.url === '/messages' && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs animate-pulse"
                  >
                    3
                  </Badge>
                )}
                {item.url === '/bookings' && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs"
                  >
                    2
                  </Badge>
                )}
              </NavLink>
            );
          })}

          {/* More Menu Trigger */}
          {secondaryItems.length > 0 && (
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex flex-col items-center justify-center gap-1 h-auto p-2 rounded-lg"
                >
                  <Menu className="h-4 w-4" />
                  <span className="text-xs font-medium opacity-80">More</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[50vh]">
                <DrawerHeader className="pb-2">
                  <DrawerTitle className="text-center">More Options</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-6">
                  <div className={cn('grid gap-2', RESPONSIVE_GRIDS.form)}>
                    {secondaryItems.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <NavLink
                          key={item.url}
                          to={item.url}
                          onClick={() => setIsDrawerOpen(false)}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg transition-colors',
                            'hover:bg-muted',
                            isActive 
                              ? 'bg-primary/10 text-primary border border-primary/20' 
                              : 'text-foreground'
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="font-medium">{item.title}</span>
                          {isActive && (
                            <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          )}
        </div>

        {/* Quick Actions Bar - Swipeable */}
        <div className="flex items-center justify-center gap-2 py-1 overflow-x-auto">
          <Button size="sm" variant="ghost" className="text-xs px-2 py-1 h-auto">
            <Search className="h-3 w-3 mr-1" />
            Find
          </Button>
          <Button size="sm" variant="ghost" className="text-xs px-2 py-1 h-auto">
            <Plus className="h-3 w-3 mr-1" />
            Book
          </Button>
          {profile?.role === 'artisan' && (
            <Button size="sm" variant="ghost" className="text-xs px-2 py-1 h-auto">
              <Calendar className="h-3 w-3 mr-1" />
              Schedule
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}

// Enhanced floating action button for key actions
interface FloatingActionButtonProps {
  action: 'search' | 'book' | 'message' | 'add';
  onClick: () => void;
  className?: string;
}

export function FloatingActionButton({ 
  action, 
  onClick, 
  className 
}: FloatingActionButtonProps) {
  const { isMobile } = useResponsive();
  
  if (!isMobile) return null;

  const actionConfig = {
    search: { icon: Search, label: 'Search Services', color: 'bg-primary' },
    book: { icon: Plus, label: 'Book Service', color: 'bg-success' },
    message: { icon: MessageSquare, label: 'Messages', color: 'bg-trust' },
    add: { icon: Plus, label: 'Add', color: 'bg-accent' }
  };

  const config = actionConfig[action];
  const Icon = config.icon;

  return (
    <Button
      onClick={onClick}
      className={cn(
        'fixed bottom-20 right-4 z-30 h-12 w-12 rounded-full shadow-lg',
        'hover:scale-110 transition-transform',
        config.color,
        className
      )}
      size="sm"
    >
      <Icon className="h-5 w-5" />
      <span className="sr-only">{config.label}</span>
    </Button>
  );
}

// Context menu for mobile long press
export function MobileContextMenu({ 
  children, 
  items 
}: { 
  children: React.ReactNode;
  items: Array<{ label: string; onClick: () => void; icon?: React.ComponentType<any> }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile } = useResponsive();

  if (!isMobile) return <>{children}</>;

  const handleLongPress = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsOpen(true);
  };

  return (
    <div
      onTouchStart={(e) => {
        let pressTimer = setTimeout(() => handleLongPress(e), 500);
        e.currentTarget.addEventListener('touchend', () => clearTimeout(pressTimer));
        e.currentTarget.addEventListener('touchmove', () => clearTimeout(pressTimer));
      }}
    >
      {children}
      
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"
          onClick={() => setIsOpen(false)}
        >
          <div className="bg-background rounded-lg p-4 mx-4 w-full max-w-sm">
            <div className="space-y-2">
              {items.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}