import { createClient } from '@supabase/supabase-js';

// Official WattWiseAI Supabase Project Configuration
const SUPABASE_PROJECT_URL = 'https://vxvgrtyvnulgnpcaadry.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_WpFw-SjHnKMG639HhtPHaw_R3jVrBTq';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_PROJECT_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
                    import.meta.env.VITE_SUPABASE_ANON_KEY || 
                    SUPABASE_PUBLISHABLE_KEY;

// Check if valid credentials are provided
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('demo-placeholder')
);

// Single, application-wide Supabase Client Instance
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});
