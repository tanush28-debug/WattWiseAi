import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { authService } from '../services/authService';
import { USER_ROLES } from '../config/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and restore session on mount
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (mounted) {
          // If no stored user in demo mode, initialize with default Consumer user for instant preview
          if (!currentUser && !isSupabaseConfigured) {
            const defaultDemoUser = {
              id: 'usr-demo-001',
              email: 'sarah.jenkins@wattwise.ai',
              fullName: 'Sarah Jenkins',
              role: USER_ROLES.CONSUMER,
              isDemo: true
            };
            setUser(defaultDemoUser);
          } else {
            setUser(currentUser);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listen to Supabase auth events if configured
    let subscription = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const u = await authService.getCurrentUser();
          if (mounted) setUser(u);
        } else {
          if (mounted) setUser(null);
        }
      });
      subscription = data?.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const result = await authService.login(credentials);
      setUser(result.user);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      const result = await authService.register(payload);
      if (result.user && !result.needsVerification) {
        setUser(result.user);
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    return await authService.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (newPassword) => {
    return await authService.resetPassword(newPassword);
  }, []);

  /**
   * Evaluator role switch: allows judges and hackathon reviewers to switch views
   */
  const switchDemoRole = useCallback((newRole) => {
    if (!user) return;
    const names = {
      [USER_ROLES.CONSUMER]: 'Sarah Jenkins (Consumer)',
      [USER_ROLES.INDUSTRIAL]: 'Marcus Vance (Industrial Director)',
      [USER_ROLES.GOVERNMENT]: 'Dr. Elena Rostova (Energy Policy Admin)'
    };
    const updated = {
      ...user,
      role: newRole,
      fullName: names[newRole] || user.fullName
    };
    setUser(updated);
    localStorage.setItem('wattwise_active_user', JSON.stringify(updated));
  }, [user]);

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    loading,
    isSupabaseConfigured,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    switchDemoRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

