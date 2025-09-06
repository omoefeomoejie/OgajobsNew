import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

interface NavigationContextType {
  intendedDestination: string | null;
  setIntendedDestination: (path: string) => void;
  clearIntendedDestination: () => void;
  getSmartRedirectPath: (userRole?: string) => string;
  redirectAfterAuth: (userRole?: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const NAVIGATION_STORAGE_KEY = 'ogajobs_intended_destination';
const NAVIGATION_EXPIRY_KEY = 'ogajobs_navigation_expiry';
const NAVIGATION_EXPIRY_HOURS = 2; // Expire after 2 hours

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [intendedDestination, setIntendedDestinationState] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Load intended destination from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(NAVIGATION_STORAGE_KEY);
    const expiry = localStorage.getItem(NAVIGATION_EXPIRY_KEY);
    
    if (stored && expiry) {
      const expiryTime = parseInt(expiry, 10);
      const now = Date.now();
      
      if (now < expiryTime) {
        setIntendedDestinationState(stored);
        logger.debug('Restored intended destination', { destination: stored });
      } else {
        // Clean up expired navigation data
        localStorage.removeItem(NAVIGATION_STORAGE_KEY);
        localStorage.removeItem(NAVIGATION_EXPIRY_KEY);
        logger.debug('Cleared expired navigation data');
      }
    }
  }, []);

  const setIntendedDestination = (path: string) => {
    // Don't store auth-related paths or home page
    if (path === '/' || path.startsWith('/auth')) {
      return;
    }

    setIntendedDestinationState(path);
    
    // Store with expiration
    const expiryTime = Date.now() + (NAVIGATION_EXPIRY_HOURS * 60 * 60 * 1000);
    localStorage.setItem(NAVIGATION_STORAGE_KEY, path);
    localStorage.setItem(NAVIGATION_EXPIRY_KEY, expiryTime.toString());
    
    logger.debug('Set intended destination', { destination: path });
  };

  const clearIntendedDestination = () => {
    setIntendedDestinationState(null);
    localStorage.removeItem(NAVIGATION_STORAGE_KEY);
    localStorage.removeItem(NAVIGATION_EXPIRY_KEY);
    logger.debug('Cleared intended destination');
  };

  const getSmartRedirectPath = (userRole?: string): string => {
    // First priority: intended destination
    if (intendedDestination) {
      return intendedDestination;
    }

    // Second priority: role-based default dashboard
    if (userRole) {
      switch (userRole) {
        case 'admin':
        case 'super_admin':
          return '/admin';
        case 'pos_agent':
        case 'agent':
          return '/agent-dashboard';
        case 'artisan':
          return '/dashboard';
        case 'client':
        default:
          return '/dashboard';
      }
    }

    // Default fallback
    return '/dashboard';
  };

  const redirectAfterAuth = (userRole?: string) => {
    const redirectPath = getSmartRedirectPath(userRole);
    
    logger.info('Redirecting after authentication', { 
      userRole, 
      redirectPath,
      hadIntendedDestination: !!intendedDestination 
    });
    
    // Clear the intended destination since we're using it
    clearIntendedDestination();
    
    // Navigate to the smart redirect path
    navigate(redirectPath, { replace: true });
  };

  const value = {
    intendedDestination,
    setIntendedDestination,
    clearIntendedDestination,
    getSmartRedirectPath,
    redirectAfterAuth,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}