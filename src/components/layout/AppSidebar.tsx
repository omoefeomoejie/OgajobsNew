import { useAuth } from '@/contexts/AuthContext';
import { NavLink, useLocation } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
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
  AlertTriangle,
  Headphones,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

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
    if (profile?.role === 'client') {
      return [
        { title: 'Dashboard', url: ROUTES.DASHBOARD, icon: Home },
        { title: 'Find Services', url: ROUTES.SERVICES, icon: Search },
        { title: 'My Bookings', url: ROUTES.BOOKINGS, icon: Calendar },
        { title: 'Messages', url: '/messages', icon: MessageSquare },
        { title: 'Favorites', url: '/favorites', icon: Star },
        { title: 'Reviews', url: '/reviews', icon: Star },
        { title: 'Verification', url: '/verification', icon: Shield },
        { title: 'Profile', url: '/profile', icon: User },
        { title: 'Settings', url: '/settings', icon: Settings },
      ];
    }

    if (profile?.role === 'artisan') {
      return [
        { title: 'Dashboard', url: '/dashboard', icon: Home },
        { title: 'Messages', url: '/messages', icon: MessageSquare },
        { title: 'Reviews', url: '/reviews', icon: Star },
        { title: 'Portfolio', url: '/portfolio', icon: Briefcase },
        { title: 'Disputes', url: '/disputes', icon: AlertTriangle },
        { title: 'Verification', url: '/verification', icon: Shield },
        { title: 'Profile', url: '/profile', icon: User },
        { title: 'Settings', url: '/settings', icon: Settings },
      ];
    }
    
    if (profile?.role === 'agent') {
      return [
        { title: 'Agent Dashboard', url: '/agent-dashboard', icon: Briefcase },
        { title: 'Live Chat', url: '/agent-chat', icon: Headphones },
        { title: 'Dashboard', url: '/dashboard', icon: Home },
        { title: 'Messages', url: '/messages', icon: MessageSquare },
        { title: 'Reviews', url: '/reviews', icon: Star },
        { title: 'Disputes', url: '/disputes', icon: AlertTriangle },
        { title: 'Settings', url: '/settings', icon: Settings },
      ];
    }

    if (profile?.role === 'admin') {
      return [
        { title: 'Admin Panel', url: ROUTES.ADMIN.DASHBOARD, icon: Shield },
        { title: 'User Management', url: '/admin/users', icon: Users },
        { title: 'Live Chat Support', url: '/agent-chat', icon: Headphones },
        { title: 'Dashboard', url: ROUTES.ADMIN.DASHBOARD, icon: Home },
        { title: 'Messages', url: '/messages', icon: MessageSquare },
        { title: 'Reviews', url: '/reviews', icon: Star },
        { title: 'Disputes', url: '/disputes', icon: AlertTriangle },
        { title: 'Settings', url: '/settings', icon: Settings },
      ];
    }

    // Default fallback for any other roles
    return [
      { title: 'Dashboard', url: '/dashboard', icon: Home },
      { title: 'Messages', url: '/messages', icon: MessageSquare },
      { title: 'Reviews', url: '/reviews', icon: Star },
      { title: 'Settings', url: '/settings', icon: Settings },
    ];
  };

  const navigationItems = getNavigationItems();

  return (
    <Sidebar className={state === "collapsed" ? 'w-14' : 'w-60'}>
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-4 border-b">
          <NavLink to="/" className="hover:opacity-80 transition-opacity">
            {state === "collapsed" ? (
              <Logo variant="icon" size="md" />
            ) : (
              <div className="flex items-center gap-3">
                <Logo variant="icon" size="md" />
                <div>
                  <h2 className="font-black text-2xl tracking-tight">OgaJobs</h2>
                  <p className="text-sm text-muted-foreground capitalize font-semibold">
                    {profile?.role ? (
                      <>
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {profile.role === 'client' ? 'Client Portal' : 
                         profile.role === 'artisan' ? 'Artisan Hub' : 
                         profile.role === 'admin' ? 'Admin Panel' : 
                         'User Dashboard'}
                      </>
                    ) : (
                      <>
                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                        Loading...
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}
          </NavLink>
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