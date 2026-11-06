import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const sessionVersion = useRef(0);
  const operationVersion = useRef(0);

  useEffect(() => {
    let mounted = true;
    let timer;

    const restoreUser = async (sessionUser) => {
      const version = ++sessionVersion.current;
      try {
        const currentUser = await authService.getCurrentUser(sessionUser);
        if (mounted && version === sessionVersion.current) {
          setUser(currentUser);
          setAuthError('');
        }
      } catch (error) {
        if (mounted && version === sessionVersion.current) {
          setUser(null);
          setAuthError(error.message || 'Unable to verify your account. Please try again.');
        }
      } finally {
        if (mounted && version === sessionVersion.current) setLoading(false);
      }
    };

    let subscription;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        clearTimeout(timer);
        ++sessionVersion.current;
        if (!session?.user) {
          setUser(null);
          setAuthError('');
          setLoading(false);
          return;
        }
        setLoading(true);
        // Supabase holds its session lock while notifying auth subscribers.
        timer = setTimeout(() => restoreUser(session.user), 0);
      });
      subscription = data.subscription;
    } else {
      restoreUser();
    }

    return () => {
      mounted = false;
      ++sessionVersion.current;
      ++operationVersion.current;
      clearTimeout(timer);
      subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const operation = ++operationVersion.current;
    ++sessionVersion.current;
    setLoading(true);
    setAuthError('');
    try {
      const result = await authService.login(credentials);
      if (operation === operationVersion.current) {
        ++sessionVersion.current;
        setUser(result.user);
      }
      return result;
    } catch (error) {
      if (operation === operationVersion.current) {
        ++sessionVersion.current;
        setUser(null);
        setAuthError(error.message || 'Unable to sign in. Please try again.');
      }
      throw error;
    } finally {
      if (operation === operationVersion.current) setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    const operation = ++operationVersion.current;
    ++sessionVersion.current;
    setLoading(true);
    setAuthError('');
    try {
      const result = await authService.register(payload);
      if (operation === operationVersion.current) {
        ++sessionVersion.current;
        setUser(result.user);
      }
      return result;
    } catch (error) {
      if (operation === operationVersion.current) {
        ++sessionVersion.current;
        setUser(null);
        setAuthError(error.message || 'Unable to verify your new account. Please try again.');
      }
      throw error;
    } finally {
      if (operation === operationVersion.current) setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const operation = ++operationVersion.current;
    ++sessionVersion.current;
    setLoading(true);
    try {
      await authService.logout();
      if (operation === operationVersion.current) {
        ++sessionVersion.current;
        setUser(null);
        setAuthError('');
      }
    } finally {
      if (operation === operationVersion.current) setLoading(false);
    }
  }, []);

  const forgotPassword = useCallback((email) => authService.forgotPassword(email), []);

  const resetPassword = useCallback(async (newPassword) => {
    const result = await authService.resetPassword(newPassword);
    ++sessionVersion.current;
    setUser(null);
    return result;
  }, []);

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    loading,
    authError,
    isSupabaseConfigured,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
