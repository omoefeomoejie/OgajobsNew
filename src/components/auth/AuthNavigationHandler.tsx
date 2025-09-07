import { useEffect } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';

/**
 * Component that handles navigation events emitted by AuthContext
 * This prevents circular dependencies between AuthContext and NavigationContext
 */
export function AuthNavigationHandler() {
  const navigation = useNavigation();

  useEffect(() => {
    // Handle email confirmation redirects
    const handleEmailConfirmed = (event: CustomEvent) => {
      const { role } = event.detail;
      navigation.redirectAfterAuth(role);
    };

    // Handle sign out navigation cleanup
    const handleSignedOut = () => {
      navigation.clearIntendedDestination();
    };

    // Add event listeners
    window.addEventListener('auth:emailConfirmed', handleEmailConfirmed as EventListener);
    window.addEventListener('auth:signedOut', handleSignedOut);

    // Cleanup
    return () => {
      window.removeEventListener('auth:emailConfirmed', handleEmailConfirmed as EventListener);
      window.removeEventListener('auth:signedOut', handleSignedOut);
    };
  }, [navigation]);

  // This component doesn't render anything
  return null;
}