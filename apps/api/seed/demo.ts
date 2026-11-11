import { db } from '../src/db.js';
import { migrate } from '../src/migrate.js';
import { seedDemo } from '../src/seed.js';

await migrate(db);
try {
  await seedDemo(db);
} finally {
  await db.end();
}
