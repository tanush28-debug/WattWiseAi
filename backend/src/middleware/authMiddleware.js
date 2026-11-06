import { supabase, createUserScopedClient } from '../config/supabase.js';

const PROFILE_ROLES = new Set(['CONSUMER', 'INDUSTRIAL', 'GOVERNMENT_ADMIN']);

export async function authenticateUser(req, res, next) {
  const match = req.headers.authorization?.match(/^Bearer ([^\s]+)$/i);
  if (!match) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Missing or malformed Bearer token.',
    });
  }

  try {
    const token = match[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      const unavailable = authError?.status === 0 || authError?.status >= 500;
      return res.status(unavailable ? 503 : 401).json({
        success: false,
        message: unavailable
          ? 'Authentication service is unavailable. Please try again.'
          : 'Invalid or expired authentication session.',
      });
    }

    const userScopedClient = createUserScopedClient(token);
    const { data: profile, error: profileError } = await userScopedClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return res.status(503).json({
        success: false,
        message: 'Unable to verify your account profile. Please try again.',
      });
    }
    if (!profile || profile.is_active !== true || !PROFILE_ROLES.has(profile.role)) {
      return res.status(403).json({
        success: false,
        message: 'Your account profile is missing or inactive. Contact your administrator.',
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: profile.role,
      fullName: profile.full_name,
      organizationId: profile.organization_id || null,
      profile,
      isDemo: false,
    };
    req.supabase = userScopedClient;
    return next();
  } catch {
    return res.status(503).json({
      success: false,
      message: 'Authentication service is unavailable. Please try again.',
    });
  }
}

export async function optionalAuth(req, res, next) {
  if (!req.headers.authorization) {
    req.user = null;
    req.supabase = supabase;
    return next();
  }
  return authenticateUser(req, res, next);
}
