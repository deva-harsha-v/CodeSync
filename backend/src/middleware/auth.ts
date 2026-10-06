import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { db } from '../config/database';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'Developer' | 'Reviewer' | 'Viewer';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Check for quick demo header 'x-user-id'
    const demoUserId = req.header('x-user-id');
    if (demoUserId) {
      const result = await db.query('SELECT id, email, full_name, role FROM profiles WHERE id = ?', [demoUserId]);
      if (result.rows.length > 0) {
        const u = result.rows[0];
        req.user = {
          id: u.id,
          email: u.email,
          fullName: u.full_name,
          role: u.role
        };
        return next();
      }
    }

    // 2. Check Authorization Bearer token
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
      const result = await db.query('SELECT id, email, full_name, role FROM profiles WHERE id = ?', [decoded.id]);
      if (result.rows.length > 0) {
        const u = result.rows[0];
        req.user = {
          id: u.id,
          email: u.email,
          fullName: u.full_name,
          role: u.role
        };
        return next();
      }
    }

    // Default to Developer A if unauthenticated for local demo ease
    const fallback = await db.query("SELECT id, email, full_name, role FROM profiles WHERE id = 'user_dev_a'");
    if (fallback.rows.length > 0) {
      const u = fallback.rows[0];
      req.user = {
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        role: u.role
      };
    }

    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Unauthorized', message: err.message });
  }
}

export function requireRole(allowedRoles: Array<'Admin' | 'Developer' | 'Reviewer' | 'Viewer'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Action requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
      });
      return;
    }

    next();
  };
}

/**
 * Server-side authorization check for file modification:
 * Allowed if:
 * 1. User is Admin
 * 2. User is the registered owner of the file
 * 3. User has an approved access_request for the file
 */
export async function canUserEditFile(userId: string, userRole: string, fileId: string): Promise<{ allowed: boolean; reason: string; ownerId?: string }> {
  if (userRole === 'Admin') {
    return { allowed: true, reason: 'Admin override permitted' };
  }

  if (userRole === 'Viewer' || userRole === 'Reviewer') {
    return { allowed: false, reason: `Role ${userRole} is read-only for source files` };
  }

  // Check file ownership
  const ownerRes = await db.query(
    'SELECT owner_id FROM file_ownership WHERE file_id = ? AND status = ?',
    [fileId, 'active']
  );

  const ownerId = ownerRes.rows.length > 0 ? ownerRes.rows[0].owner_id : null;

  if (ownerId === userId) {
    return { allowed: true, reason: 'Direct artifact owner', ownerId };
  }

  // Check if an approved access request exists
  const accessRes = await db.query(
    "SELECT id FROM access_requests WHERE file_id = ? AND requester_id = ? AND status = 'approved'",
    [fileId, userId]
  );

  if (accessRes.rows.length > 0) {
    return { allowed: true, reason: 'Approved access request delegation active', ownerId };
  }

  return {
    allowed: false,
    reason: `File is owned by user [${ownerId || 'unassigned'}]. Access request required.`,
    ownerId
  };
}
