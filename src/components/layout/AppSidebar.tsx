import { useAuth } from '@/contexts/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
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
  const { profile, signOut, activeMode, setActiveMode, canSwitchMode } = useAuth();
  const { state } = useSidebar();
  const navigate = useNavigate();

  const isArtisanSetup = profile?.role === 'artisan' || profile?.available_as_artisan;

  const handleModeSwitch = () => {
    if (activeMode === 'client' && !isArtisanSetup) {
      navigate(ROUTES.BECOME_ARTISAN);
    } else {
      const newMode = activeMode === 'client' ? 'artisan' : 'client';
      setActiveMode(newMode);
      navigate('/dashboard');
    }
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-white/20 text-white font-semibold' : 'text-white/80 hover:bg-white/10 hover:text-white';

  // Navigation items driven by activeMode for client/artisan; role for admin/agent
  const getNavigationItems = () => {
    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      return [
        { title: 'Mission Control', url: ROUTES.ADMIN.CONTROL_PANEL, icon: Shield },
        { title: 'User Management', url: ROUTES.ADMIN.USERS, icon: Users },
        { title: 'Financial Reports', url: ROUTES.ADMIN.FINANCIAL_REPORTS, icon: Briefcase },
        { title: 'Monitoring', url: ROUTES.ADMIN.MONITORING, icon: AlertTriangle },
        { title: 'Live Chat', url: '/agent-chat', icon: Headphones },
        { title: 'Messages', url: '/messages', icon: MessageSquare },
        { title: 'Disputes', url: '/disputes', icon: AlertTriangle },
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

    if (activeMode === 'artisan') {
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

    // Default: client nav
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
  };

  const navigationItems = getNavigationItems();

  const portalLabel =
    (profile?.role === 'admin' || profile?.role === 'super_admin') ? 'Mission Control' :
    profile?.role === 'agent' ? 'Agent Dashboard' :
    activeMode === 'artisan' ? 'Artisan Hub' :
    'Client Portal';

  return (
    <Sidebar className={state === "collapsed" ? 'w-14' : 'w-60'}>
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-4 border-b border-white/10">
          <NavLink to="/" className="hover:opacity-80 transition-opacity">
            {state === "collapsed" ? (
              <Logo variant="icon" size="md" />
            ) : (
              <div className="flex items-center gap-3">
                <Logo variant="icon" size="md" />
                <div>
                  <h2 className="font-black text-2xl tracking-tight text-white">OgaJobs</h2>
                  <p className="text-sm text-white/60 capitalize font-semibold">
                    {profile?.role ? (
                      <>
                        <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        {portalLabel}
                      </>
                    ) : (
                      <>
                        <span className="inline-block w-2 h-2 bg-white/40 rounded-full mr-2"></span>
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
          <SidebarGroupLabel className="text-white/40 uppercase text-xs tracking-widest">Navigation</SidebarGroupLabel>
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

        {/* Mode Toggle — shown to all non-admin/non-agent users */}
        {canSwitchMode && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div className="flex items-center gap-2">
                {activeMode === 'client' ? (
                  <Search className="h-4 w-4 text-white/70" />
                ) : (
                  <Briefcase className="h-4 w-4 text-white/70" />
                )}
                {state !== 'collapsed' && (
                  <span className="text-sm font-medium text-white/80">
                    {activeMode === 'artisan'
                      ? 'Artisan Mode'
                      : isArtisanSetup
                      ? 'Client Mode'
                      : 'Want to offer services?'}
                  </span>
                )}
              </div>
              {state !== 'collapsed' && (
                <button
                  onClick={handleModeSwitch}
                  className="text-xs text-green-300 hover:underline font-medium"
                >
                  {activeMode === 'client' && !isArtisanSetup
                    ? 'Get Started →'
                    : activeMode === 'client'
                    ? 'Switch to Artisan'
                    : 'Switch to Client'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* User Actions */}
        <div className="mt-auto p-4 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white"
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
