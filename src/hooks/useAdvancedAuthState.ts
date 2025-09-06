import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isInitialized: boolean;
}

interface AuthStateManager {
  state: AuthState;
  refreshSession: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  recoverSession: () => Promise<void>;
}

// Mutex to prevent race conditions in auth state changes
class AuthMutex {
  private locked = false;
  private queue: (() => void)[] = [];

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.locked = false;
    }
  }
}

export function useAdvancedAuthState(): AuthStateManager {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isInitialized: false,
  });

  const mutexRef = useRef(new AuthMutex());
  const lastSessionRef = useRef<Session | null>(null);
  const sessionValidationTimerRef = useRef<NodeJS.Timeout>();

  // Safe state update with mutex protection
  const updateAuthState = useCallback(async (updates: Partial<AuthState>) => {
    await mutexRef.current.acquire();
    try {
      setState(prevState => ({
        ...prevState,
        ...updates,
      }));
    } finally {
      mutexRef.current.release();
    }
  }, []);

  // Validate current session
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.warn('Session validation failed', { error: error.message });
        return false;
      }

      if (!session) {
        logger.debug('No active session found');
        return false;
      }

      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        logger.warn('Session has expired', { 
          expiresAt: session.expires_at, 
          now 
        });
        return false;
      }

      // Update state if session is valid and different
      if (!lastSessionRef.current || lastSessionRef.current.access_token !== session.access_token) {
        await updateAuthState({
          session,
          user: session.user,
        });
        lastSessionRef.current = session;
      }

      return true;
    } catch (error) {
      logger.error('Session validation error', { error });
      return false;
    }
  }, [updateAuthState]);

  // Refresh session with retry logic
  const refreshSession = useCallback(async (): Promise<void> => {
    let retries = 3;
    
    while (retries > 0) {
      try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        
        if (error) {
          throw error;
        }

        await updateAuthState({
          session,
          user: session?.user ?? null,
        });

        lastSessionRef.current = session;
        logger.debug('Session refreshed successfully');
        return;
        
      } catch (error) {
        retries--;
        logger.warn(`Session refresh failed, retries left: ${retries}`, { error });
        
        if (retries === 0) {
          // Clear invalid session
          await updateAuthState({
            session: null,
            user: null,
          });
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }, [updateAuthState]);

  // Recover session after network issues or interruptions
  const recoverSession = useCallback(async (): Promise<void> => {
    logger.info('Attempting session recovery');
    
    try {
      // First, try to validate existing session
      const isValid = await validateSession();
      
      if (!isValid) {
        // Try to refresh the session
        await refreshSession();
      }
      
      logger.info('Session recovery completed');
    } catch (error) {
      logger.error('Session recovery failed', { error });
      
      // Clear session on recovery failure
      await updateAuthState({
        session: null,
        user: null,
      });
    }
  }, [validateSession, refreshSession, updateAuthState]);

  // Set up periodic session validation
  useEffect(() => {
    const startSessionValidation = () => {
      // Validate session every 5 minutes
      sessionValidationTimerRef.current = setInterval(async () => {
        if (state.session) {
          const isValid = await validateSession();
          if (!isValid) {
            logger.warn('Session validation failed, attempting recovery');
            await recoverSession();
          }
        }
      }, 5 * 60 * 1000); // 5 minutes
    };

    if (state.isInitialized && state.session) {
      startSessionValidation();
    }

    return () => {
      if (sessionValidationTimerRef.current) {
        clearInterval(sessionValidationTimerRef.current);
      }
    };
  }, [state.isInitialized, state.session, validateSession, recoverSession]);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      await mutexRef.current.acquire();
      
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('Initial auth check failed', { error: error.message });
        }

        if (isMounted) {
          await updateAuthState({
            session,
            user: session?.user ?? null,
            loading: false,
            isInitialized: true,
          });
          
          lastSessionRef.current = session;
          logger.debug('Auth state initialized', { hasSession: !!session });
        }
      } finally {
        mutexRef.current.release();
      }
    };

    initializeAuth();

    // Set up auth state change listener with enhanced error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        logger.debug('Auth state change detected', { event, hasSession: !!session });

        await mutexRef.current.acquire();
        
        try {
          // Handle different auth events
          switch (event) {
            case 'SIGNED_IN':
              await updateAuthState({
                session,
                user: session?.user ?? null,
                loading: false,
              });
              break;
              
            case 'SIGNED_OUT':
              await updateAuthState({
                session: null,
                user: null,
                loading: false,
              });
              break;
              
            case 'TOKEN_REFRESHED':
              await updateAuthState({
                session,
                user: session?.user ?? null,
              });
              break;
              
            default:
              await updateAuthState({
                session,
                user: session?.user ?? null,
                loading: false,
              });
          }
          
          lastSessionRef.current = session;
        } finally {
          mutexRef.current.release();
        }
      }
    );

    // Handle page visibility changes for session recovery
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state.session) {
        // Validate session when page becomes visible
        setTimeout(() => {
          validateSession();
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (sessionValidationTimerRef.current) {
        clearInterval(sessionValidationTimerRef.current);
      }
    };
  }, [updateAuthState, validateSession]);

  return {
    state,
    refreshSession,
    validateSession,
    recoverSession,
  };
}