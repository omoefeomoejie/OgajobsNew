import { useAuth } from '@/contexts/AuthContext';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Home,
  Search,
  Calendar,
  MessageSquare,
  Star,
  CreditCard,
  Settings,
  Users,
  Shield,
  Briefcase,
  User,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ogaJobsLogo from '@/assets/ogajobs-logo.png';

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50';

  // Different navigation items based on user role
  const getNavigationItems = () => {
    const commonItems = [
      { title: 'Dashboard', url: '/dashboard', icon: Home },
      { title: 'Messages', url: '/messages', icon: MessageSquare },
      { title: 'Reviews', url: '/reviews', icon: Star },
    ];

    if (profile?.role === 'client') {
      return [
        ...commonItems,
        { title: 'Find Services', url: '/services', icon: Search },
        { title: 'My Bookings', url: '/bookings', icon: Calendar },
        { title: 'Payments', url: '/payments', icon: CreditCard },
      ];
    }

    if (profile?.role === 'artisan') {
      return [
        ...commonItems,
        { title: 'Portfolio', url: '/portfolio', icon: Briefcase },
        { title: 'My Jobs', url: '/jobs', icon: Calendar },
        { title: 'Verification', url: '/verification', icon: Shield },
        { title: 'Earnings', url: '/earnings', icon: CreditCard },
        { title: 'Profile', url: '/profile', icon: User },
      ];
    }

    // Admin items - but admin panel removed from sidebar since it has separate access
    return [
      ...commonItems,
      { title: 'User Management', url: '/admin/users', icon: Users },
      { title: 'Settings', url: '/settings', icon: Settings },
    ];
  };

  const navigationItems = getNavigationItems();

  return (
    <Sidebar className={state === "collapsed" ? 'w-14' : 'w-60'}>
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <img src={ogaJobsLogo} alt="OgaJobs" className="w-8 h-8" />
            {state !== "collapsed" && (
              <div>
                <h2 className="font-bold text-lg">OgaJobs</h2>
                <p className="text-xs text-muted-foreground capitalize">
                  {profile?.role || 'User'} Dashboard
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Actions */}
        <div className="mt-auto p-4 border-t">
          <Button
            variant="outline"
            onClick={signOut}
            className="w-full justify-start"
            size={state === "collapsed" ? 'icon' : 'default'}
          >
            <LogOut className="h-4 w-4" />
            {state !== "collapsed" && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}