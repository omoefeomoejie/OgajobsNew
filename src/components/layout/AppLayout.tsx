import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { InstallPrompt } from '@/components/mobile/InstallPrompt';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { PresenceIndicator } from '@/components/realtime/PresenceIndicator';
import { OfflineIndicator } from '@/components/mobile/OfflineIndicator';
import LiveChatWidget from '@/components/chat/LiveChatWidget';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Global header with sidebar trigger */}
          <header className="h-12 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <SidebarTrigger className="ml-2" />
            <div className="flex-1 flex items-center justify-between px-4">
              <h1 className="text-lg font-semibold">OgaJobs Platform</h1>
              <div className="flex items-center gap-3">
                <PresenceIndicator />
                <NotificationCenter />
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto pb-20 md:pb-0">
            {children}
          </main>
        </div>
      </div>
      {/* Enhanced Install Prompt */}
      <InstallPrompt />
      {/* Offline/Online Indicator */}
      <OfflineIndicator />
      {/* Live Chat Support Widget */}
      <LiveChatWidget />
    </SidebarProvider>
  );
};