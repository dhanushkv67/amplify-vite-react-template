import { hash, Algorithm } from '@node-rs/argon2';
import type { Pool } from 'pg';
const demo = {
  ownerEmail: 'demo-owner@example.test', memberEmail: 'demo-member@example.test',
  project: 'Demo project', task: 'Review the project board',
  comment: 'Welcome to the project board.',
} as const;

/** Opt-in demo data. Refuse to create known accounts in a production environment. */
export async function seedDemo(db: Pool) {
  if (process.env.DEMO_SEED !== 'true') return;
  if (process.env.NODE_ENV === 'production' || process.env.DEPLOYMENT_ENV === 'production') {
    throw new Error('Demo seed is forbidden in production');
  }
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 12) throw new Error('DEMO_PASSWORD must contain at least 12 characters');
  const passwordHash = await hash(password, { algorithm: Algorithm.Argon2id });
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [4242002]);
    const users: bigint[] = [];
    for (const email of [demo.ownerEmail, demo.memberEmail]) {
      const result = await client.query<{ id: string }>(
        `INSERT INTO users (email, password_hash) VALUES ($1,$2)
         ON CONFLICT (lower(email)) DO UPDATE SET email = EXCLUDED.email
         RETURNING id`, [email, passwordHash]);
      users.push(BigInt(result.rows[0].id));
    }
    const project = await client.query<{ id: string }>(
      'SELECT id FROM projects WHERE created_by = $1 AND name = $2 ORDER BY id LIMIT 1',
      [users[0].toString(), demo.project]);
    let projectId = project.rows[0]?.id;
    if (!projectId) {
      const inserted = await client.query<{ id: string }>(
        'INSERT INTO projects (name, created_by) VALUES ($1,$2) RETURNING id',
        [demo.project, users[0].toString()]);
      projectId = inserted.rows[0].id;
    }
    for (const id of users) {
      await client.query('INSERT INTO project_memberships (project_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [projectId, id.toString()]);
    }
    const existingTask = await client.query<{ id: string }>(
      'SELECT id FROM tasks WHERE project_id = $1 AND title = $2 ORDER BY id LIMIT 1',
      [projectId, demo.task]);
    let taskId = existingTask.rows[0]?.id;
    if (!taskId) {
      const inserted = await client.query<{ id: string }>(
        'INSERT INTO tasks (project_id,title,created_by) VALUES ($1,$2,$3) RETURNING id',
        [projectId, demo.task, users[0].toString()]);
      taskId = inserted.rows[0].id;
    }
    await client.query(
      `INSERT INTO comments (task_id,author_id,body)
       SELECT $1,$2,$3 WHERE NOT EXISTS
       (SELECT 1 FROM comments WHERE task_id=$1 AND author_id=$2 AND body=$3)`,
      [taskId, users[0].toString(), demo.comment]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
