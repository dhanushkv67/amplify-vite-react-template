import { createApp } from './app.js';
import { db } from './db.js';
import { port } from './config.js';
import { migrate } from './migrate.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

async function main() {
  await migrate(db);
  const server = createApp({ db }).listen(port, '0.0.0.0', () => console.log(`API listening on ${port}`));
  const shutdown = () => server.close(() => { void db.end(); });
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error('API startup failed', error);
    void db.end().finally(() => { process.exitCode = 1; });
  });
}
