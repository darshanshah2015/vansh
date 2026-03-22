import type { Request, Response, NextFunction } from 'express';
import { eq, and, gte } from 'drizzle-orm';
import { db } from '@db/index';
import { sessions, users } from '@db/schema/index';
import { UnauthorizedError, ForbiddenError } from '../shared/errors/index';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        verificationStatus: string;
      };
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.session;
    if (!token) {
      throw new UnauthorizedError('No session token provided');
    }

    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gte(sessions.expiresAt, new Date())))
      .limit(1);

    if (!session) {
      throw new UnauthorizedError('Invalid or expired session');
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        verificationStatus: users.verificationStatus,
      })
      .from(users)
      .where(and(eq(users.id, session.userId), eq(users.isActive, true)))
      .limit(1);

    if (!user) {
      throw new UnauthorizedError('User not found or deactivated');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }
  next();
}
