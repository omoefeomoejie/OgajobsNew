import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LEGACY_ROUTES } from '@/config/routes';

/**
 * Component to handle legacy route redirects
 * Automatically redirects old URLs to their new equivalents
 */
export function LegacyRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    const redirectPath = LEGACY_ROUTES[currentPath as keyof typeof LEGACY_ROUTES];
    
    if (redirectPath) {
      // Preserve search params and hash
      const fullRedirectPath = redirectPath + location.search + location.hash;
      navigate(fullRedirectPath, { replace: true });
    }
  }, [location, navigate]);

  return null; // This component only handles redirects
}