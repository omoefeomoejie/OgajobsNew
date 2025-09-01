import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface Profile {
  id: string;
  email: string;
  role: string;
  created_at: string;
  identity_verified?: boolean;
  skills_verified?: boolean;
  trust_score?: number;
  verification_level?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<void> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userMetadataRole = userData?.user?.user_metadata?.role;

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
        // Prioritize user metadata role as source of truth
        if (userMetadataRole && data.role !== userMetadataRole) {
          const correctedProfile = {
            ...data,
            role: userMetadataRole
          };
          setProfile(correctedProfile);
          
          // Background sync without blocking
          setTimeout(async () => {
            try {
              await supabase
                .from('profiles')
                .update({ role: userMetadataRole })
                .eq('id', userId);
            } catch (syncError) {
              logger.warn('Background role sync failed', { userId });
            }
          }, 1000);
        } else {
          setProfile(data);
        }
      } else {
        // Create profile with security defaults
        if (!userData?.user?.email) {
          logger.error('Cannot create profile without email', { userId });
          return;
        }
        
        try {
          const defaultRole = userData.user.user_metadata?.role || 'client';
          const { data: newProfile, error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              email: userData.user.email,
              role: defaultRole
            })
            .select()
            .single();

          if (upsertError) {
            logger.error('Profile creation failed', { userId, error: upsertError.message });
            // Set minimal fallback profile
            setProfile({
              id: userId,
              email: userData.user.email,
              role: defaultRole,
              created_at: new Date().toISOString()
            });
            return;
          }

          setProfile(newProfile);
        } catch (createError) {
          logger.error('Profile creation exception', { userId });
          // Fallback profile to prevent app crash
          setProfile({
            id: userId,
            email: userData.user.email || '',
            role: userMetadataRole || 'client',
            created_at: new Date().toISOString()
          });
        }
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

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            await fetchProfile(initialSession.user.id);
          }
          
          setLoading(false);
        }
      } catch (error) {
        logger.error('Auth initialization failed');
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Secure auth state listener - prevents deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Defer profile fetch to prevent auth deadlock
          setTimeout(() => {
            if (isMounted) {
              fetchProfile(currentSession.user.id);
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('Signout failed', { error: error.message });
      }
      
      // Clear state
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      logger.error('Signout exception');
      // Force clear on error
      setUser(null);
      setSession(null);
      setProfile(null);
    } finally {
      setLoading(false);
      window.location.href = '/';
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signOut,
    refreshProfile,
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