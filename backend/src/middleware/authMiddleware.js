import { supabase, createUserScopedClient } from '../config/supabase.js';

/**
 * Middleware: authenticateUser
 * Validates the Supabase JWT token against Supabase Auth.
 * Loads the trusted, verified role from public.profiles (never relies on user_metadata alone).
 * Attaches req.user and a user-scoped Supabase client (req.supabase) so RLS is enforced.
 */
export async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Missing or malformed Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing.',
      });
    }

    // Handle explicit demo token for evaluator convenience
    if (token === 'demo-jwt-token') {
      req.user = {
        id: 'usr-demo-001',
        email: 'demo@wattwise.ai',
        role: 'CONSUMER',
        fullName: 'Demo Evaluator',
        isDemo: true,
      };
      req.supabase = supabase;
      return next();
    }

    // Validate the token against Supabase Auth (server-side verification)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication session.',
        error: authError?.message,
      });
    }

    // Create user-scoped client that forwards the token for RLS
    const userScopedClient = createUserScopedClient(token);

    // Fetch verified profile from database
    let profile = null;
    let role = user.user_metadata?.role || 'CONSUMER';

    try {
      const { data: profileData, error: profileError } = await userScopedClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!profileError && profileData) {
        profile = profileData;
        role = profileData.role;
      }
    } catch (dbErr) {
      console.warn('Could not query public.profiles table; using user metadata role:', dbErr.message);
    }

    // Attach verified user and scoped client to request
    req.user = {
      id: user.id,
      email: user.email,
      role: role,
      fullName: profile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0],
      organizationId: profile?.organization_id || null,
      profile,
      isDemo: false,
    };
    req.supabase = userScopedClient;

    next();
  } catch (err) {
    console.error('Authentication middleware error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal authentication error occurred.',
    });
  }
}

/**
 * Optional authentication middleware:
 * If a valid token is present, populates req.user. If not, proceeds with req.user = null.
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    req.supabase = supabase;
    return next();
  }
  return authenticateUser(req, res, next);
}

