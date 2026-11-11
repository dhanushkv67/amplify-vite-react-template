import type { RequestHandler } from 'express';

/** Verify browser write requests against the exact externally configured origin. */
export const requireSameOrigin: RequestHandler = (request, response, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next();
  const origin = request.get('origin');
  const expected = process.env.APP_ORIGIN ?? `${request.protocol}://${request.get('host')}`;
  // Non-browser clients (including the API acceptance harness) can omit Origin;
  // browsers sending cross-site requests cannot spoof this header. Reject browser
  // fetches without Origin and every mismatched or malformed Origin.
  if (!origin) {
    if (request.get('sec-fetch-site')) { response.status(403).json({ error: 'Forbidden origin' }); return; }
    return next();
  }
  if (origin !== expected) { response.status(403).json({ error: 'Forbidden origin' }); return; }
  next();
};
