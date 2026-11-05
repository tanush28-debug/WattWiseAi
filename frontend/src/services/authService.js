import { supabase, isSupabaseConfigured } from './supabaseClient';
import { apiClient } from './api';
import { USER_ROLES } from '../config/constants';

// Storage key for active user session profile
const DEMO_USER_KEY = 'wattwise_active_user';

export const authService = {
  /**
   * Get current authenticated user and verified role
   */
  async getCurrentUser() {
    if (isSupabaseConfigured) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return null;

        // Fetch verified role from backend API or Supabase user metadata
        let role = user.user_metadata?.role || USER_ROLES.CONSUMER;
        try {
          // Attempt to fetch verified role from Node.js Express backend if available
          const response = await apiClient.get('/auth/me');
          if (response?.role) {
            role = response.role;
          }
        } catch (apiErr) {
          // If backend endpoint is pending, fallback to user_metadata
          console.debug('Backend /auth/me not reached, using user_metadata:', role);
        }

        return {
          id: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name || user.email.split('@')[0],
          role: role,
          isVerified: true
        };
      } catch (err) {
        console.error('Error fetching current user:', err);
        return null;
      }
    } else {
      // In Demo / Offline Mode, retrieve saved demo session or null
      const stored = localStorage.getItem(DEMO_USER_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
      return null;
    }
  },

  /**
   * Sign in with email and password
   */
  async login({ email, password }) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      
      const role = data.user?.user_metadata?.role || USER_ROLES.CONSUMER;
      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name || email.split('@')[0],
          role: role
        },
        session: data.session
      };
    } else {
      // Demo authentication simulation
      // For quick evaluation: if email contains 'industrial', role is INDUSTRIAL
      // If email contains 'gov' or 'admin', role is GOVERNMENT
      // Otherwise default to CONSUMER
      let role = USER_ROLES.CONSUMER;
      let name = 'Sarah Jenkins';

      const lowerEmail = email.toLowerCase();
      if (lowerEmail.includes('industrial') || lowerEmail.includes('facility') || lowerEmail.includes('factory')) {
        role = USER_ROLES.INDUSTRIAL;
        name = 'Marcus Vance (Plant Operations)';
      } else if (lowerEmail.includes('gov') || lowerEmail.includes('admin') || lowerEmail.includes('policy')) {
        role = USER_ROLES.GOVERNMENT;
        name = 'Dr. Elena Rostova (Energy Commission)';
      }

      const demoUser = {
        id: 'usr-demo-' + Math.random().toString(36).substring(2, 9),
        email,
        fullName: name,
        role: role,
        isDemo: true
      };

      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      return { user: demoUser, session: { access_token: 'demo-jwt-token' } };
    }
  },

  /**
   * Register a new user (Consumer or Industrial only)
   * Government accounts must NOT self-register
   */
  async register({ fullName, email, password, accountType }) {
    // Validate role constraint
    if (accountType !== USER_ROLES.CONSUMER && accountType !== USER_ROLES.INDUSTRIAL) {
      throw new Error('Self-registration is only permitted for Consumer and Industrial accounts.');
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: accountType
          }
        }
      });

      if (error) {
        // Provide clear, actionable diagnostic messages for known Supabase errors
        if (error.message?.includes('Database error saving new user')) {
          throw new Error('Database error saving new user: The database signup trigger requires updating. Run FIX_SIGNUP_TRIGGER.sql in your Supabase SQL Editor.');
        }
        throw error;
      }

      // Check if user already exists (Supabase returns empty identities array when email enumeration protection is on)
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new Error('An account with this email address already exists. Please sign in.');
      }

      return {
        user: data.user,
        session: data.session,
        needsVerification: !data.session
      };
    } else {
      const demoUser = {
        id: 'usr-demo-' + Math.random().toString(36).substring(2, 9),
        email,
        fullName,
        role: accountType,
        isDemo: true
      };
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      return { user: demoUser, needsVerification: false };
    }
  },

  /**
   * Send password reset email
   */
  async forgotPassword(email) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      return true;
    } else {
      // Simulate delay
      await new Promise(r => setTimeout(r, 600));
      return true;
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(newPassword) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return true;
    } else {
      await new Promise(r => setTimeout(r, 600));
      return true;
    }
  },

  /**
   * Logout user
   */
  async logout() {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }
    localStorage.removeItem(DEMO_USER_KEY);
  }
};

