import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import type { Pool } from 'pg';

export const cookieName = 'session';
export const inactivityMs = 24 * 60 * 60 * 1000;
export type Database = Pick<Pool, 'query'>;
export type AuthUser = { id: string; email: string };

const tokenDigest = (token: string) => createHash('sha256').update(token).digest('hex');

function cookieOptions(request: Request) {
  // Set APP_ORIGIN to the external HTTPS origin when TLS is terminated upstream.
  const secure = request.secure || process.env.APP_ORIGIN?.startsWith('https://') === true;
  return { httpOnly: true, secure, sameSite: 'lax' as const, path: '/', maxAge: inactivityMs };
}

export function readToken(request: Request): string | null {
  const parts = (request.headers.cookie ?? '').split(';');
  const values = parts.filter(part => part.trimStart().startsWith(`${cookieName}=`));
  if (values.length !== 1) return null;
  const token = values[0].trim().slice(cookieName.length + 1);
  return /^[a-f0-9]{64}$/.test(token) ? token : null;
}

export async function issueSession(db: Database, userId: string, request: Request, response: Response) {
  const token = randomBytes(32).toString('hex');
  await db.query('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenDigest(token), new Date(Date.now() + inactivityMs)]);
  response.cookie(cookieName, token, cookieOptions(request));
}

export async function currentSession(db: Database, request: Request, response: Response): Promise<AuthUser | null> {
  const token = readToken(request);
  if (!token) return null;
  const expiry = new Date(Date.now() + inactivityMs);
  // A single atomic write checks the old expiry before extending it. Concurrent
  // requests cannot resurrect a session that has already expired or been revoked.
  const result = await db.query<{ id: string; email: string }>(
    `UPDATE sessions AS s SET expires_at = $2
     FROM users AS u WHERE s.token_hash = $1 AND s.expires_at > $3 AND u.id = s.user_id
     RETURNING u.id::text AS id, u.email`, [tokenDigest(token), expiry, new Date()]);
  if (result.rowCount !== 1) return null;
  response.cookie(cookieName, token, cookieOptions(request));
  return result.rows[0];
}

export async function revokeSession(db: Database, request: Request) {
  const token = readToken(request);
  if (token) await db.query('DELETE FROM sessions WHERE token_hash = $1', [tokenDigest(token)]);
}

export function clearSession(request: Request, response: Response) {
  const { maxAge: _maxAge, ...options } = cookieOptions(request);
  response.clearCookie(cookieName, options);
}
