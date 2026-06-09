import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenant_id: string | null;
  };
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the JWT token using Supabase auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch user details from public.users table to get tenant_id, role, status
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('tenant_id, role, full_name, status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: 'User profile not found or database sync missing' });
    }

    if (profile.status !== 'active') {
      return res.status(403).json({ error: `User account is ${profile.status}` });
    }

    // Check if user has MFA enabled in user_mfa table
    const { data: mfaSetup } = await supabase
      .from('user_mfa')
      .select('is_enabled')
      .eq('user_id', user.id)
      .maybeSingle();

    if (mfaSetup && mfaSetup.is_enabled) {
      const mfaToken = req.headers['x-mfa-token'] as string;
      if (!mfaToken) {
        return res.status(401).json({ error: 'MFA_REQUIRED', message: 'MFA verification required' });
      }
      try {
        const decoded = jwt.verify(mfaToken, process.env.JWT_SECRET || 'your-super-secret-jwt-signing-key-change-in-production') as any;
        if (decoded.userId !== user.id || !decoded.mfaVerified) {
          return res.status(401).json({ error: 'MFA_REQUIRED', message: 'Invalid MFA verification token' });
        }
      } catch (err) {
        return res.status(401).json({ error: 'MFA_REQUIRED', message: 'MFA token expired or invalid' });
      }
    }

    let tenantId = profile.tenant_id;
    if ((profile.role === 'super_admin' || profile.role === 'admin' || profile.role === 'senior_accountant') && req.headers['x-impersonate-tenant-id']) {
      tenantId = req.headers['x-impersonate-tenant-id'] as string;
    }

    req.user = {
      id: user.id,
      email: user.email || '',
      role: profile.role,
      tenant_id: tenantId
    };

    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Authentication failed', details: err.message });
  }
};

export const requireRoles = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};
