import express from 'express';
import type { Pool } from 'pg';

/** Construct the application without opening sockets or requiring a live database. */
export function createApp({ db }: { db: Pick<Pool, 'query'> }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.get('/api/health', async (_request, response) => {
    try {
      await db.query('SELECT 1');
      response.json({ status: 'ok' });
    } catch {
      response.status(503).json({ status: 'unavailable' });
    }
  });
  return app;
}
