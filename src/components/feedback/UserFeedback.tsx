import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FeedbackMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  persistent?: boolean;
}

interface UserFeedbackProps {
  message: FeedbackMessage;
  onDismiss: (id: string) => void;
  className?: string;
}

const FeedbackIcon = ({ type }: { type: FeedbackMessage['type'] }) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info
  };
  
  const Icon = icons[type];
  const colors = {
    success: 'text-success',
    error: 'text-destructive',
    warning: 'text-warning',
    info: 'text-primary'
  };
  
  return <Icon className={cn('h-5 w-5', colors[type])} />;
};

export function UserFeedback({ message, onDismiss, className }: UserFeedbackProps) {
  useEffect(() => {
    if (!message.persistent && message.duration !== 0) {
      const timer = setTimeout(() => {
        onDismiss(message.id);
      }, message.duration || 5000);
      
      return () => clearTimeout(timer);
    }
  }, [message, onDismiss]);

  const bgColors = {
    success: 'bg-success/10 border-success/20',
    error: 'bg-destructive/10 border-destructive/20',
    warning: 'bg-warning/10 border-warning/20',
    info: 'bg-primary/10 border-primary/20'
  };

  return (
    <Card className={cn(
      'animate-fade-in border-l-4',
      bgColors[message.type],
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <FeedbackIcon type={message.type} />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{message.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{message.message}</p>
            {message.action && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={message.action.onClick}
              >
                {message.action.label}
              </Button>
            )}
          </div>
          {!message.persistent && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto"
              onClick={() => onDismiss(message.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Global feedback manager
class FeedbackManager {
  private listeners = new Set<(messages: FeedbackMessage[]) => void>();
  private messages: FeedbackMessage[] = [];

  subscribe(listener: (messages: FeedbackMessage[]) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.messages]));
  }

  add(message: Omit<FeedbackMessage, 'id'>) {
    const id = Math.random().toString(36).substr(2, 9);
    const fullMessage = { ...message, id };
    this.messages.push(fullMessage);
    this.notify();
    return id;
  }

  remove(id: string) {
    this.messages = this.messages.filter(m => m.id !== id);
    this.notify();
  }

  clear() {
    this.messages = [];
    this.notify();
  }

  success(title: string, message: string, action?: FeedbackMessage['action']) {
    return this.add({ type: 'success', title, message, action });
  }

  error(title: string, message: string, action?: FeedbackMessage['action']) {
    return this.add({ type: 'error', title, message, action, persistent: true });
  }

  warning(title: string, message: string, action?: FeedbackMessage['action']) {
    return this.add({ type: 'warning', title, message, action });
  }

  info(title: string, message: string, action?: FeedbackMessage['action']) {
    return this.add({ type: 'info', title, message, action });
  }
}

export const feedbackManager = new FeedbackManager();

// Hook for using feedback
export function useFeedback() {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);

  useEffect(() => {
    const unsubscribe = feedbackManager.subscribe(setMessages);
    return unsubscribe;
  }, []);

  const dismiss = (id: string) => {
    feedbackManager.remove(id);
  };

  return { messages, dismiss };
}

// Feedback container component
export function FeedbackContainer() {
  const { messages, dismiss } = useFeedback();

  if (messages.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {messages.map(message => (
        <UserFeedback
          key={message.id}
          message={message}
          onDismiss={dismiss}
        />
      ))}
    </div>
  );
}

// Network status feedback
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      feedbackManager.success(
        'Connection Restored',
        'You are back online. All features are now available.'
      );
    };

    const handleOffline = () => {
      setIsOnline(false);
      feedbackManager.error(
        'Connection Lost',
        'You are currently offline. Some features may not work properly.',
        {
          label: 'Retry',
          onClick: () => window.location.reload()
        }
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Badge variant="destructive" className="flex items-center gap-2">
        <WifiOff className="h-3 w-3" />
        Offline
      </Badge>
    </div>
  );
}

// Loading state feedback
export function LoadingFeedback({ 
  isLoading, 
  message = 'Loading...',
  className 
}: { 
  isLoading: boolean; 
  message?: string;
  className?: string;
}) {
  if (!isLoading) return null;

  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="flex items-center gap-3">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    </div>
  );
}

// Form validation feedback
export function ValidationFeedback({ 
  errors, 
  className 
}: { 
  errors: string[]; 
  className?: string;
}) {
  if (errors.length === 0) return null;

  return (
    <div className={cn('space-y-1', className)}>
      {errors.map((error, index) => (
        <p key={index} className="text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      ))}
    </div>
  );
}