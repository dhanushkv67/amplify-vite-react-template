import { Router, type Request, type RequestHandler } from 'express';
import type { Pool } from 'pg';
import { parseTaskChanges, positiveId, statusFromDatabase, statusToDatabase, TaskInputError, type TaskChanges } from '../validation/task.js';

/** Mount at /api/projects/:projectId/tasks with mergeParams enabled below.
 * Integrator supplies the existing session and membership middleware plus its
 * authoritative session-to-user mapping; never trust a user id in the body.
 * db must be a Pool (connect() is required for atomic membership checks).
 */
export function createTasksRouter({ db, requireAuth, requireProjectMember, getUserId }: {
  db: Pick<Pool, 'query' | 'connect'>;
  requireAuth: RequestHandler;
  requireProjectMember: RequestHandler;
  getUserId: (request: Request) => string | number | undefined;
}) {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireProjectMember);
  const projectId = (req: Request) => positiveId(req.params.projectId);
  const actorId = (req: Request) => positiveId(getUserId(req));
  const SELECT = `SELECT t.id::text AS id, t.project_id::text AS "projectId", t.title, t.description,
    t.status, t.assignee_id::text AS "assigneeId", u.email AS "assigneeEmail",
    to_char(t.due_date, 'YYYY-MM-DD') AS "dueDate", t.created_by::text AS "createdBy",
    t.created_at AS "createdAt", t.updated_at AS "updatedAt"
    FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id`;
  const present = (row: Record<string, unknown>) => ({ ...row, status: statusFromDatabase[String(row.status)] });
  const fail = (res: import('express').Response, error: unknown) => {
    if (error instanceof TaskInputError) return res.status(400).json({ error: error.message });
    console.error('Task operation failed', error);
    return res.status(500).json({ error: 'Task operation failed' });
  };
  const authorized = (req: Request, res: import('express').Response) => {
    const project = projectId(req), user = actorId(req);
    if (!project || !user) { res.status(400).json({ error: 'Invalid project or session' }); return null; }
    return { project, user };
  };
  const taskId = (req: Request, res: import('express').Response) => {
    const id = positiveId(req.params.taskId);
    if (!id) res.status(400).json({ error: 'Invalid task id' });
    return id;
  };

  router.get('/', async (req, res) => {
    const scope = authorized(req, res); if (!scope) return;
    try {
      const membership = await db.query('SELECT 1 FROM project_memberships WHERE project_id = $1 AND user_id = $2', [scope.project, scope.user]);
      if (!membership.rowCount) return res.status(404).json({ error: 'Project not found' });
      const found = await db.query(`${SELECT} JOIN project_memberships pm ON pm.project_id = t.project_id AND pm.user_id = $2
        WHERE t.project_id = $1 ORDER BY t.id`, [scope.project, scope.user]);
      res.json(found.rows.map(present));
    } catch (error) { fail(res, error); }
  });

  router.get('/:taskId', async (req, res) => {
    const scope = authorized(req, res), id = taskId(req, res); if (!scope || !id) return;
    try {
      const found = await db.query(`${SELECT} JOIN project_memberships pm ON pm.project_id = t.project_id AND pm.user_id = $3
        WHERE t.project_id = $1 AND t.id = $2`, [scope.project, id, scope.user]);
      if (!found.rowCount) return res.status(404).json({ error: 'Task not found' });
      res.json(present(found.rows[0]));
    } catch (error) { fail(res, error); }
  });

  async function save(req: Request, res: import('express').Response, create: boolean) {
    const scope = authorized(req, res); if (!scope) return;
    const id = create ? null : taskId(req, res); if (!create && !id) return;
    let changes: TaskChanges;
    try { changes = parseTaskChanges(req.body, create); }
    catch (error) { fail(res, error); return; }
    const client = await db.connect().catch(error => { fail(res, error); return null; });
    if (!client) return;
    try {
      await client.query('BEGIN');
      // FOR SHARE serializes removal against the whole save; when removal wins,
      // no insert/update occurs. Both actor and proposed assignee are checked.
      const actor = await client.query('SELECT 1 FROM project_memberships WHERE project_id = $1 AND user_id = $2 FOR SHARE', [scope.project, scope.user]);
      if (!actor.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Project not found' }); }
      if (changes.assigneeId) {
        const assigned = await client.query('SELECT 1 FROM project_memberships WHERE project_id = $1 AND user_id = $2 FOR SHARE', [scope.project, changes.assigneeId]);
        if (!assigned.rowCount) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Assignee must be a current project member' }); }
      }
      // An existing assignee is retained by PATCH, not reassigned implicitly.
      let saved;
      if (create) {
        saved = await client.query(`INSERT INTO tasks (project_id, created_by, title, description, status, due_date, assignee_id)
          VALUES ($1, $2, $3, $4, 'todo', $5, $6) RETURNING id::text AS id`,
          [scope.project, scope.user, changes.title, changes.description ?? '', changes.dueDate ?? null, changes.assigneeId ?? null]);
      } else {
        const fields: string[] = [], values: unknown[] = [scope.project, id];
        const columns: [keyof TaskChanges, string][] = [['title', 'title'], ['description', 'description'], ['status', 'status'], ['dueDate', 'due_date'], ['assigneeId', 'assignee_id']];
        for (const [key, column] of columns) if (Object.prototype.hasOwnProperty.call(changes, key)) {
          const value = key === 'status' ? statusToDatabase[changes.status!] : changes[key];
          values.push(value);
          fields.push(`${column} = $${values.length}`);
        }
        saved = await client.query(`UPDATE tasks SET ${fields.join(', ')}, updated_at = now()
          WHERE project_id = $1 AND id = $2 RETURNING id::text AS id`, values);
      }
      if (!saved.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Task not found' }); }
      const found = await client.query(`${SELECT} WHERE t.project_id = $1 AND t.id = $2`, [scope.project, saved.rows[0].id]);
      await client.query('COMMIT');
      return res.status(create ? 201 : 200).json(present(found.rows[0]));
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { /* original failure is reported */ }
      return fail(res, error);
    } finally { client.release(); }
  }
  router.post('/', (req, res) => { void save(req, res, true); });
  router.patch('/:taskId', (req, res) => { void save(req, res, false); });
  return router;
}
