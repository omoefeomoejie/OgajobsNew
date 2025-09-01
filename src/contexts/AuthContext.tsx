import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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

  const fetchProfile = async (userId: string) => {
    try {
      // Get fresh user data first to use as source of truth
      const { data: userData } = await supabase.auth.getUser();
      const userMetadataRole = userData?.user?.user_metadata?.role;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        console.log('Found existing profile:', data);
        console.log('User metadata role:', userMetadataRole);
        
        // Always prioritize user metadata role as source of truth
        if (userMetadataRole && data.role !== userMetadataRole) {
          console.log(`Role mismatch detected: Profile has "${data.role}", user metadata has "${userMetadataRole}". Using metadata role as source of truth.`);
          
          // Create corrected profile with metadata role
          const correctedProfile = {
            ...data,
            role: userMetadataRole
          };
          
          console.log('Using corrected profile with metadata role:', correctedProfile);
          setProfile(correctedProfile);
          
          // Try to sync database in background without blocking UI
          setTimeout(async () => {
            try {
              console.log('Attempting background database role sync...');
              const { error: bgSyncError } = await supabase
                .from('profiles')
                .update({ role: userMetadataRole })
                .eq('id', userId);
              
              if (bgSyncError) {
                console.warn('Background role sync failed (database issue), but continuing with correct role from metadata:', bgSyncError);
              } else {
                console.log('Background role sync completed successfully');
              }
            } catch (backgroundSyncErr) {
              console.warn('Background role sync failed (exception), but continuing with correct role from metadata:', backgroundSyncErr);
            }
          }, 2000);
        } else {
          console.log('Profile role matches metadata or no metadata role found, using profile as-is');
          setProfile(data);
        }
      } else {
        // If no profile exists, create one with default values
        console.log('=== CREATING NEW PROFILE ===');
        console.log('Creating new profile for user:', userId);
        
        if (!userData?.user) {
          console.error('No user data available for profile creation');
          return;
        }
        
        try {
          const defaultRole = userData.user.user_metadata?.role || 'client';
          console.log('Using role for new profile:', defaultRole);
          console.log('Using email for new profile:', userData.user.email);
          
          // Use upsert to handle race conditions
          const { data: newProfile, error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              email: userData.user.email || '',
              role: defaultRole
            })
            .select()
            .single();

          if (upsertError) {
            console.error('Error upserting profile:', upsertError);
            
            // Still set a basic profile object so the app doesn't break
            const fallbackProfile = {
              id: userId,
              email: userData.user.email || '',
              role: defaultRole,
              created_at: new Date().toISOString()
            };
            console.log('Setting fallback profile after upsert error:', fallbackProfile);
            setProfile(fallbackProfile);
            return;
          }

          console.log('Profile created successfully:', newProfile);
          setProfile(newProfile);
        } catch (createErr) {
          console.error('Profile creation failed with exception:', createErr);
          // Fallback profile to prevent app crash
          const fallbackProfile = {
            id: userId,
            email: userData.user.email || '',
            role: userMetadataRole || 'client',
            created_at: new Date().toISOString()
          };
          console.log('Setting fallback profile after exception:', fallbackProfile);
          setProfile(fallbackProfile);
        }
        console.log('=== END CREATING NEW PROFILE ===');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        await fetchProfile(initialSession.user.id);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Fetch profile after authentication
          setTimeout(() => {
            fetchProfile(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      // Clear local state immediately
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      // Force clear session even if error occurs
      setUser(null);
      setSession(null);
      setProfile(null);
    } finally {
      setLoading(false);
      // Redirect to home page after clearing state
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