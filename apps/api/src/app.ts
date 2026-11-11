import express from 'express';
import type { Pool } from 'pg';
import { authRouter } from './routes/auth.js';
import { requireSameOrigin } from './origin.js';
import { requireAuth } from './middleware/requireAuth.js';
import { createProjectsRouter } from './routes/projects.js';
import { createProjectAccess } from './middleware/projectAccess.js';
import { createTasksRouter } from './routes/tasks.js';

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
  const auth = requireAuth(db);
  const userId = (request: express.Request) => request.authUser?.id;
  const access = createProjectAccess(db, userId);
  app.use('/api/projects', createProjectsRouter({ db, requireAuth: auth, getUserId: userId }));
  app.use('/api/projects/:projectId/tasks', createTasksRouter({ db, requireAuth: auth, requireProjectMember: access.requireMember, getUserId: userId }));
  return app;
}
