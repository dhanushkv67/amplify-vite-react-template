import { Router } from 'express';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { clearSession, currentSession, issueSession, revokeSession, type Database } from '../auth/session.js';
import { loginRateLimit } from '../rateLimit.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function normalizedEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && emailPattern.test(email) ? email : null;
}

export function authRouter(db: Database) {
  const router = Router();
  router.post('/signup', async (request, response, next) => {
    try {
      const email = normalizedEmail(request.body?.email);
      const password = request.body?.password;
      if (!email || typeof password !== 'string' || password.length < 12) {
        response.status(400).json({ error: 'Valid email and password of at least 12 characters required' }); return;
      }
      // Check before expensive hashing; unique index remains the final arbiter of races.
      const existing = await db.query('SELECT 1 FROM users WHERE lower(email) = $1', [email]);
      if (existing.rowCount) { response.status(409).json({ error: 'Email already registered' }); return; }
      const passwordHash = await hashPassword(password);
      const inserted = await db.query<{ id: string; email: string }>(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id::text AS id, email', [email, passwordHash]);
      response.status(201).json(inserted.rows[0]);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        response.status(409).json({ error: 'Email already registered' }); return;
      }
      next(error);
    }
  });
  router.post('/login', loginRateLimit(), async (request, response, next) => {
    try {
      const email = normalizedEmail(request.body?.email);
      const password = request.body?.password;
      const failed = () => response.status(401).json({ error: 'Invalid email or password' });
      if (!email || typeof password !== 'string') { failed(); return; }
      const found = await db.query<{ id: string; email: string; password_hash: string }>(
        'SELECT id::text AS id, email, password_hash FROM users WHERE lower(email) = $1', [email]);
      if (!found.rows[0] || !(await verifyPassword(found.rows[0].password_hash, password))) { failed(); return; }
      const { id, email: registeredEmail } = found.rows[0];
      await issueSession(db, id, request, response);
      response.json({ id, email: registeredEmail });
    } catch (error) { next(error); }
  });
  router.post('/logout', async (request, response, next) => {
    try { await revokeSession(db, request); clearSession(request, response); response.status(204).end(); }
    catch (error) { next(error); }
  });
  router.get('/me', async (request, response, next) => {
    try {
      const user = await currentSession(db, request, response);
      if (!user) { response.status(401).json({ error: 'Authentication required' }); return; }
      response.json(user);
    } catch (error) { next(error); }
  });
  return router;
}
