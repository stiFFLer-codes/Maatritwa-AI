import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);
const API_BASE_URL = 'http://localhost:8000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const lastSignupAttemptRef = useRef(0); // ✓ FIX: Changed to useRef for immediate updates
  const SIGNUP_COOLDOWN = 3000; // 3 second cooldown between signup attempts
  const loginInFlightRef = useRef(false);
  const signupInFlightRef = useRef(false);
  const signupAbortControllerRef = useRef(null);
  const roleFetchControllerRef = useRef(null);

  const fetchUserRole = useCallback(async (accessToken) => {
    if (!accessToken) {
      setUserRole(null);
      setRoleLoading(false);
      return;
    }

    if (roleFetchControllerRef.current) {
      roleFetchControllerRef.current.abort();
    }

    const controller = new AbortController();
    roleFetchControllerRef.current = controller;
    setRoleLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: controller.signal
      });

      if (response.ok) {
        const userData = await response.json();
        setUserRole(userData.role || null);
      } else if (response.status === 404 || response.status === 403) {
        // User exists in auth but profile/role is not onboarded yet.
        setUserRole(null);
      } else {
        setUserRole(null);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Role fetch failed:', error);
      }
    } finally {
      setRoleLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) {
          return;
        }

        if (session?.user && session?.access_token) {
          setUser(session.user);
          await fetchUserRole(session.access_token);
        } else {
          setUser(null);
          setUserRole(null);
          setRoleLoading(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) {
          return;
        }

        if (session?.user && session?.access_token) {
          setUser(session.user);
          await fetchUserRole(session.access_token);
        } else {
          setUser(null);
          setUserRole(null);
          setRoleLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      roleFetchControllerRef.current?.abort();
    };
  }, [fetchUserRole]);

  const login = async (email, password) => {
    if (loginInFlightRef.current) {
      throw new Error('Login is already in progress. Please wait.');
    }

    loginInFlightRef.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      if (err?.status === 429) {
        throw new Error('Too many login attempts. Please wait a few minutes and try again.');
      }
      throw err;
    } finally {
      loginInFlightRef.current = false;
    }
  };

  const signup = async (email, password, role) => {
    if (signupInFlightRef.current) {
      throw new Error('Signup is already in progress. Please wait.');
    }

    // Check cooldown to prevent rapid requests - using ref for immediate updates
    const now = Date.now();
    const timeSinceLastAttempt = now - lastSignupAttemptRef.current;
    if (timeSinceLastAttempt < SIGNUP_COOLDOWN) {
      const waitTime = Math.ceil((SIGNUP_COOLDOWN - timeSinceLastAttempt) / 1000);
      throw new Error(`Please wait ${waitTime} second${waitTime !== 1 ? 's' : ''} before trying again.`);
    }
    lastSignupAttemptRef.current = now;

    signupInFlightRef.current = true;
    
    // Cancel any previous in-flight signup attempts
    if (signupAbortControllerRef.current) {
      signupAbortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    signupAbortControllerRef.current = abortController;
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role
          }
        }
      });
      
      if (error) {
        // Handle rate limiting specifically
        if (error.status === 429) {
          throw new Error('Too many signup attempts. Please try again in a few minutes.');
        }
        throw error;
      }
      
      return data;
    } catch (err) {
      // Provide helpful error messages
      if (err.name === 'AbortError') {
        throw new Error('Request cancelled - a new signup attempt was started.');
      }
      if (err.message.includes('429') || err.message.includes('Too many')) {
        throw new Error('Too many signup attempts. Please wait a few minutes before trying again.');
      }
      if (err.message.includes('already registered')) {
        throw new Error('This email is already registered. Please sign in instead.');
      }
      throw err;
    } finally {
      signupInFlightRef.current = false;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setUserRole(null);
    setRoleLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, roleLoading, userRole, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
