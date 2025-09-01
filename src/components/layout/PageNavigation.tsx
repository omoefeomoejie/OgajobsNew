import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageNavigationProps {
  title?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  className?: string;
}

export const PageNavigation: React.FC<PageNavigationProps> = ({
  title,
  showBackButton = true,
  showHomeButton = true,
  className,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-between p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-40",
      className
    )}>
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        
        {showHomeButton && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex items-center gap-2"
          >
            <Link to="/">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
        )}
      </div>

      {title && (
        <h1 className="text-lg font-semibold text-center flex-1 mx-4">
          {title}
        </h1>
      )}

      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          Need help?
        </div>
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};