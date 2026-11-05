import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

// Base Supabase client using publishable/anon key
export const supabase = createClient(config.supabase.url, config.supabase.publishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

/**
 * Creates a user-scoped Supabase client that forwards the authenticated user's JWT token.
 * This guarantees that PostgreSQL Row Level Security (RLS) is applied to all database queries.
 * @param {string} accessToken - Supabase user JWT access token
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export const createUserScopedClient = (accessToken) => {
  if (!accessToken) return supabase;
  
  return createClient(config.supabase.url, config.supabase.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

/**
 * Privileged Admin Supabase client (only available if SUPABASE_SECRET_KEY is configured).
 * Used exclusively for server-level administrative jobs, not routine user requests.
 */
export const supabaseAdmin = config.supabase.secretKey
  ? createClient(config.supabase.url, config.supabase.secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

