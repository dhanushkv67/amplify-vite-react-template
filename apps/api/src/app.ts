import express from 'express';
import type { Pool } from 'pg';
import { authRouter } from './routes/auth.js';
import { requireSameOrigin } from './origin.js';

/** Construct the application without opening sockets or requiring a live database. */
export function createApp({ db }: { db: Pick<Pool, 'query'> }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use('/api', requireSameOrigin);
  app.get('/api/health', async (_request, response) => {
    try {
      await db.query('SELECT 1');
      response.json({ status: 'ok' });
    } catch {
      response.status(503).json({ status: 'unavailable' });
    }
  });
  app.use('/api/auth', authRouter(db));
  return app;
}
