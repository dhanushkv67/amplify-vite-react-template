import { createHash } from 'node:crypto';
import type { RequestHandler } from 'express';

// Per-app in-memory throttle. A shared store is necessary for multiple replicas.
export function loginRateLimit(): RequestHandler {
  const attempts = new Map<string, { count: number; until: number }>();
  return (request, response, next) => {
    const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
    const key = createHash('sha256').update(`${request.ip ?? 'unknown'}:${email}`).digest('hex');
    const now = Date.now();
    const entry = attempts.get(key);
    if (entry && entry.until > now && entry.count >= 10) {
      response.setHeader('Retry-After', String(Math.ceil((entry.until - now) / 1000)));
      response.status(429).json({ error: 'Too many attempts. Try again later.' });
      return;
    }
    if (attempts.size >= 10_000) for (const [id, value] of attempts) {
      if (value.until <= now) attempts.delete(id);
    }
    if (!entry && attempts.size >= 10_000) {
      response.status(429).json({ error: 'Too many attempts. Try again later.' }); return;
    }
    if (entry && entry.until > now) entry.count++;
    else attempts.set(key, { count: 1, until: now + 15 * 60_000 });
    next();
  };
}
