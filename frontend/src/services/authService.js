import { supabase, isSupabaseConfigured } from './supabaseClient';
import { apiClient } from './api';
import { USER_ROLES } from '../config/constants';

// Storage key for active user session profile
const DEMO_USER_KEY = 'wattwise_active_user';

const toAppRole = (role) => {
  if (role === 'GOVERNMENT_ADMIN') return USER_ROLES.GOVERNMENT;
  if (role === USER_ROLES.CONSUMER || role === USER_ROLES.INDUSTRIAL) return role;
  return null;
};

const resolveVerifiedUser = async (user) => {
  const response = await apiClient.get('/auth/me');
  const profile = response?.user;
  const role = toAppRole(profile?.role);
  if (!response?.success || profile?.id !== user.id || !role) {
    throw new Error('Unable to verify your account profile. Please try again.');
  }
  return { ...profile, role, isVerified: true };
};

export const authService = {
  /**
   * Get current authenticated user and verified role
   */
  async getCurrentUser(sessionUser) {
    if (isSupabaseConfigured) {
      let user = sessionUser;
      if (!user) {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) return null;
        user = data.user;
      }
      return resolveVerifiedUser(user);
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
        email: email.trim(),
        password
      });
      if (error) throw error;

      return {
        user: await resolveVerifiedUser(data.user),
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
      return { user: demoUser, session: null };
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
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login?role=${accountType}`,
          data: {
            full_name: fullName.trim(),
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
        user: data.session ? await resolveVerifiedUser(data.user) : null,
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
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      return true;
    } else {
      throw new Error('Password recovery is unavailable in demo mode.');
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(newPassword) {
    if (isSupabaseConfigured) {
      const { data, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !data.user) {
        throw new Error('A valid recovery session is required. Request a new password reset link.');
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      await this.logout();
      return true;
    } else {
      throw new Error('Password recovery is unavailable in demo mode.');
    }
  },

  /**
   * Logout user
   */
  async logout() {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
    }
    localStorage.removeItem(DEMO_USER_KEY);
  }
};

