import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';

/** Each migration is atomic and recorded only after successful application. */
export async function migrate(pool: Pool, directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../migrations')) {
  const files = (await readdir(directory)).filter((name) => /^\d{3}_[a-z_]+\.sql$/.test(name)).sort();
  if (files.length === 0) throw new Error(`No migrations in ${directory}`);
  const client = await pool.connect();
  try {
    // Session lock serializes concurrent starts, including creation of the ledger.
    await client.query('SELECT pg_advisory_lock($1)', [4242001]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    for (const file of files) {
      await client.query('BEGIN');
      try {
        const applied = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
        if (applied.rowCount === 0) {
          await client.query(await readFile(path.join(directory, file), 'utf8'));
          await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    // Releasing a pooled connection does not release a session-scoped advisory lock.
    try { await client.query('SELECT pg_advisory_unlock($1)', [4242001]); }
    finally { client.release(); }
  }
}
