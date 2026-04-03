import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useAdvancedAuthState } from '@/hooks/useAdvancedAuthState';
import { ActiveMode, getStoredActiveMode, setStoredActiveMode, clearStoredActiveMode } from '@/lib/activeMode';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at: string;
  identity_verified?: boolean;
  skills_verified?: boolean;
  trust_score?: number;
  verification_level?: string;
  available_as_artisan?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isInitialized: boolean;
  activeMode: ActiveMode;
  setActiveMode: (mode: ActiveMode) => void;
  canSwitchMode: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  recoverSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeMode, setActiveModeState] = useState<ActiveMode>('client');
  const { state: authState, refreshSession, validateSession, recoverSession } = useAdvancedAuthState();

  const { user, session, loading, isInitialized } = authState;

  const initActiveMode = (profileData: Profile) => {
    const stored = getStoredActiveMode();
    if (stored) {
      setActiveModeState(stored);
    } else {
      const defaultMode: ActiveMode =
        (profileData.role === 'artisan' || profileData.available_as_artisan)
          ? profileData.role as ActiveMode
          : 'client';
      setActiveModeState(defaultMode);
    }
  };

  const fetchProfile = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        logger.error('Profile fetch failed', { userId, error: error.message });
        return;
      }

      if (data) {
        // The profiles table is the sole source of truth for roles.
        // user_metadata is client-writable and must never be trusted for authorization.
        setProfile(data);
        initActiveMode(data);
      } else {
        // Profile not found — create one with the role from signup metadata.
        // This only runs once at account creation; thereafter the DB is authoritative.
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user?.email) {
          logger.error('Cannot create profile without email', { userId });
          return;
        }

        const role = userData.user.user_metadata?.role || 'client';

        const { data: newProfile, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: userData.user.email,
            role,
            available_as_artisan: role === 'artisan',
          })
          .select()
          .single();

        if (upsertError) {
          logger.error('Profile creation failed', { userId, error: upsertError.message });
          return;
        }

        setProfile(newProfile);
        initActiveMode(newProfile);
      }
    } catch (error) {
      logger.error('Profile fetch error', { userId });
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // Enhanced auth state management with profile synchronization
  useEffect(() => {
    let isMounted = true;

    const syncProfile = async (userId: string) => {
      if (isMounted) {
        await fetchProfile(userId);
      }
    };

    // Handle auth state changes with enhanced error handling
    const handleAuthChange = async (event: string, currentSession: Session | null) => {
      if (!isMounted) return;

      logger.debug('Enhanced auth state change', { event, hasSession: !!currentSession });

      if (currentSession?.user) {
        // Handle successful authentication
        if (event === 'SIGNED_IN') {
          // Defer profile fetch to prevent auth deadlock
          setTimeout(() => {
            syncProfile(currentSession.user.id);
          }, 0);

          // Emit custom event for email confirmation redirect
          if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const isEmailConfirmed = urlParams.get('confirmed') === 'true';

            if (isEmailConfirmed) {
              // Emit event for navigation handler to process
              setTimeout(async () => {
                if (isMounted) {
                  const { data: profileData } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', currentSession.user.id)
                    .single();

                  if (profileData?.role) {
                    window.dispatchEvent(new CustomEvent('auth:emailConfirmed', {
                      detail: { role: profileData.role }
                    }));
                  }
                }
              }, 1000);
            }
          }
        } else {
          // Regular profile sync for other events
          setTimeout(() => {
            syncProfile(currentSession.user.id);
          }, 0);
        }
      } else {
        // Clear profile on sign out
        if (isMounted) {
          setProfile(null);
          // Emit event for navigation to handle
          window.dispatchEvent(new CustomEvent('auth:signedOut'));
        }
      }
    };

    // Set up auth state listener only after advanced auth state is initialized
    let subscription: any;

    if (isInitialized) {
      const { data } = supabase.auth.onAuthStateChange(handleAuthChange);
      subscription = data.subscription;

      // Initial profile fetch if user exists
      if (user) {
        syncProfile(user.id);
      }
    }

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [isInitialized, user]);

  const setActiveMode = (mode: ActiveMode) => {
    setActiveModeState(mode);
    setStoredActiveMode(mode);
  };

  const canSwitchMode = !!(
    profile &&
    profile.role !== 'admin' &&
    profile.role !== 'super_admin' &&
    profile.role !== 'agent' &&
    profile.role !== 'pos_agent'
  );

  const signOut = async (): Promise<void> => {
    try {
      clearStoredActiveMode();
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('Signout failed', { error: error.message });
      }

      // Clear profile state (auth state is handled by useAdvancedAuthState)
      setProfile(null);
      setActiveModeState('client');
      // Emit event for navigation to handle
      window.dispatchEvent(new CustomEvent('auth:signedOut'));

      logger.info('User signed out successfully');
    } catch (error) {
      logger.error('Signout exception');
      // Force clear on error
      setProfile(null);
      setActiveModeState('client');
      // Emit event for navigation to handle
      window.dispatchEvent(new CustomEvent('auth:signedOut'));
    } finally {
      // Navigate to home page
      window.location.href = '/';
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    isInitialized,
    activeMode,
    setActiveMode,
    canSwitchMode,
    signOut,
    refreshProfile,
    refreshSession,
    validateSession,
    recoverSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
