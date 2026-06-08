import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

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

    req.user = {
      id: user.id,
      email: user.email || '',
      role: profile.role,
      tenant_id: profile.tenant_id
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
