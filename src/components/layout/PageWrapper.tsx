import React from 'react';
import { PageNavigation } from './PageNavigation';
import LiveChatWidget from '@/components/chat/LiveChatWidget';
import { cn } from '@/lib/utils';

interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
  showNavigation?: boolean;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  showChat?: boolean;
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  title,
  showNavigation = true,
  showBackButton = true,
  showHomeButton = true,
  showChat = true,
  className,
}) => {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {showNavigation && (
        <PageNavigation
          title={title}
          showBackButton={showBackButton}
          showHomeButton={showHomeButton}
        />
      )}
      
      <main className="flex-1">
        {children}
      </main>

      {showChat && <LiveChatWidget />}
    </div>
  );
};