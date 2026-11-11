import express from 'express';
import type { Pool } from 'pg';
import { authRouter } from './routes/auth.js';
import { requireSameOrigin } from './origin.js';
import { requireAuth } from './middleware/requireAuth.js';
import { createProjectsRouter } from './routes/projects.js';

/** Construct the application without opening sockets or requiring a live database. */
export function createApp({ db }: { db: Pick<Pool, 'query' | 'connect'> }) {
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
  app.use('/api/projects', createProjectsRouter({ db, requireAuth: requireAuth(db), getUserId: request => request.authUser?.id }));
  return app;
}
