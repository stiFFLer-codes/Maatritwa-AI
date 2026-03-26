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
    // Auth disabled - always no role for mock mode
    setUserRole(null);
    setRoleLoading(false);
  }, []);

useEffect(() => {
    setUser(null);
    setUserRole(null);
    setRoleLoading(false);
    setLoading(false);
  }, []);

const login = async () => {
    // Auth disabled - mock login
    return { user: { id: 'mock_user' }, session: { access_token: 'mock_token' } };
  };

  const signup = async () => {
    // Auth disabled - mock signup
    return { user: { id: 'mock_user' }, session: { access_token: 'mock_token' } };
  };

  const logout = async () => {
    // Auth disabled
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
