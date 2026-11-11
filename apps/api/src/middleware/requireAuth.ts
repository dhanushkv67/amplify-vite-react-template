import type { RequestHandler } from 'express';
import { currentSession, type AuthUser, type Database } from '../auth/session.js';

declare global {
  namespace Express {
    interface Request { authUser?: AuthUser }
  }
}

export function requireAuth(db: Database): RequestHandler {
  return async (request, response, next) => {
    try {
      const user = await currentSession(db, request, response);
      if (!user) { response.status(401).json({ error: 'Authentication required' }); return; }
      request.authUser = user;
      next();
    } catch (error) { next(error); }
  };
}
