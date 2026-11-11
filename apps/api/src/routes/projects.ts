import { Router, type RequestHandler } from 'express';
import type { PoolClient } from 'pg';
import { checkedProjectAccess, createProjectAccess, validId,
  type ProjectDatabase, type UserIdFromRequest } from '../middleware/projectAccess.js';

export type ProjectsRouterOptions = {
  db: ProjectDatabase;
  requireAuth: RequestHandler;
  getUserId: UserIdFromRequest;
};

function project(row: { id: string; name: string; created_by: string; created_at: Date }) {
  return { id: String(row.id), name: row.name, creatorId: String(row.created_by), createdAt: row.created_at };
}
function member(row: { id: string; email: string; created_at: Date }) {
  return { id: String(row.id), email: row.email, joinedAt: row.created_at };
}

/** Mount at /api/projects. Authentication is injected by #43, not guessed from cookies here. */
export function createProjectsRouter({ db, requireAuth, getUserId }: ProjectsRouterOptions) {
  const router = Router();
  const access = createProjectAccess(db, getUserId);
  router.use(requireAuth);

  router.get('/', async (request, response) => {
    const userId = String(getUserId(request) ?? '');
    if (!validId(userId)) { response.status(401).json({ error: 'Authentication required' }); return; }
    const result = await db.query<{ id: string; name: string; created_by: string; created_at: Date }>(
      `SELECT p.id, p.name, p.created_by, p.created_at FROM projects p
       JOIN project_memberships m ON m.project_id = p.id
       WHERE m.user_id = $1 ORDER BY p.created_at DESC, p.id DESC`, [userId]);
    response.json(result.rows.map(project));
  });

  router.post('/', async (request, response) => {
    const userId = String(getUserId(request) ?? '');
    if (!validId(userId)) { response.status(401).json({ error: 'Authentication required' }); return; }
    const name = request.body?.name;
    if (typeof name !== 'string' || !name.trim()) {
      response.status(400).json({ error: 'Project name is required' }); return;
    }
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<{ id: string; name: string; created_by: string; created_at: Date }>(
        'INSERT INTO projects (name, created_by) VALUES ($1, $2) RETURNING id, name, created_by, created_at',
        [name.trim(), userId]);
      const created = result.rows[0];
      await client.query('INSERT INTO project_memberships (project_id, user_id) VALUES ($1, $2)',
        [created.id, userId]);
      await client.query('COMMIT');
      response.status(201).json(project(created));
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  });

  router.get('/:projectId', access.requireMember, async (_request, response) => {
    const { projectId } = checkedProjectAccess(response.locals);
    const result = await db.query<{ id: string; name: string; created_by: string; created_at: Date }>(
      'SELECT id, name, created_by, created_at FROM projects WHERE id = $1', [projectId]);
    if (!result.rows[0]) { response.status(404).json({ error: 'Project not found' }); return; }
    response.json(project(result.rows[0]));
  });

  router.get('/:projectId/members', access.requireMember, async (_request, response) => {
    const { projectId } = checkedProjectAccess(response.locals);
    const result = await db.query<{ id: string; email: string; created_at: Date }>(
      `SELECT u.id, u.email, m.created_at FROM project_memberships m
       JOIN users u ON u.id = m.user_id WHERE m.project_id = $1 ORDER BY m.created_at, u.id`,
      [projectId]);
    response.json(result.rows.map(member));
  });

  router.post('/:projectId/members', access.requireCreator, async (request, response) => {
    const { projectId } = checkedProjectAccess(response.locals);
    const email = request.body?.email;
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      response.status(400).json({ error: 'A registered email is required' }); return;
    }
    const normalized = email.trim().toLowerCase();
    // The unique (project_id, user_id) key arbitrates concurrent additions.
    const result = await db.query<{ id: string; email: string; created_at: Date }>(
      `INSERT INTO project_memberships (project_id, user_id)
       SELECT $1, u.id FROM users u WHERE lower(u.email) = $2
       ON CONFLICT (project_id, user_id) DO NOTHING
       RETURNING user_id AS id, (SELECT email FROM users WHERE id = user_id) AS email, created_at`,
      [projectId, normalized]);
    if (result.rows[0]) { response.status(201).json(member(result.rows[0])); return; }
    const existing = await db.query('SELECT 1 FROM users WHERE lower(email) = $1', [normalized]);
    response.status(existing.rowCount ? 409 : 404).json({ error: existing.rowCount ? 'Already a member' : 'Registered user not found' });
  });

  router.delete('/:projectId/members/:userId', access.requireCreator, async (request, response) => {
    const { projectId, userId: actorId } = checkedProjectAccess(response.locals);
    const targetId = request.params.userId;
    if (!validId(targetId)) { response.status(404).json({ error: 'Member not found' }); return; }
    if (targetId === actorId) { response.status(403).json({ error: 'Creator cannot be removed' }); return; }
    const client: PoolClient = await db.connect();
    try {
      await client.query('BEGIN');
      // Serialize creator check and membership removal on this project row.
      const owner = await client.query<{ created_by: string }>(
        'SELECT created_by FROM projects WHERE id = $1 FOR UPDATE', [projectId]);
      if (!owner.rows[0] || String(owner.rows[0].created_by) !== actorId) {
        await client.query('ROLLBACK');
        response.status(403).json({ error: 'Only the creator can manage members' }); return;
      }
      if (targetId === String(owner.rows[0].created_by)) {
        await client.query('ROLLBACK');
        response.status(403).json({ error: 'Creator cannot be removed' }); return;
      }
      const removed = await client.query(
        'DELETE FROM project_memberships WHERE project_id = $1 AND user_id = $2 RETURNING user_id',
        [projectId, targetId]);
      if (!removed.rowCount) {
        await client.query('ROLLBACK');
        response.status(404).json({ error: 'Member not found' }); return;
      }
      await client.query('UPDATE tasks SET assignee_id = NULL, updated_at = now() WHERE project_id = $1 AND assignee_id = $2',
        [projectId, targetId]);
      await client.query('COMMIT');
      response.status(204).end();
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  });
  return router;
}

export default createProjectsRouter;
