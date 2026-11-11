import { Router, type Request, type RequestHandler, type Response } from 'express';
import type { Pool } from 'pg';

type CommentRow = {
  id: string;
  text: string;
  author_id: string;
  author: string;
  created_at: Date;
};

type Dependencies = {
  db: Pick<Pool, 'query'>;
  /** Must reject visitors/expired sessions and run before membership checking. */
  requireAuth: RequestHandler;
  /** Must check CURRENT membership for request.params.projectId, on every request. */
  requireProjectMember: RequestHandler;
  /** Return the authenticated session's user ID, never an ID from params/body. */
  getAuthenticatedUserId: (request: Request, response: Response) => string | number | undefined;
};

const validId = (value: unknown): value is string | number =>
  (typeof value === 'string' && /^[1-9][0-9]*$/.test(value) &&
    BigInt(value) <= 9223372036854775807n) ||
  (typeof value === 'number' && Number.isSafeInteger(value) && value > 0);

const present = (row: CommentRow) => ({
  id: row.id,
  text: row.text,
  authorId: row.author_id,
  author: row.author,
  createdAt: row.created_at,
});

/**
 * Mount at /api/projects/:projectId/tasks/:taskId/comments. This router merges
 * parent params and needs the existing session-auth and current-project-member
 * middleware plus an adapter for their authenticated user ID. The scoped SQL
 * also checks membership and task ownership, so neither route trusts taskId
 * alone or exposes comment text for a foreign project/task.
 */
export function createCommentsRouter({ db, requireAuth, requireProjectMember, getAuthenticatedUserId }: Dependencies) {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireProjectMember);

  router.get('/', async (request, response) => {
    const { projectId, taskId } = request.params as Record<string, string>;
    const userId = getAuthenticatedUserId(request, response);
    if (!validId(projectId) || !validId(taskId) || !validId(userId)) {
      response.status(404).json({ error: 'Task not found' });
      return;
    }
    try {
      // One scoped query distinguishes an authorized empty list from a denied
      // task, without an authorization check/read race or ID-only data access.
      const result = await db.query<CommentRow & { task_id: string }>(
        `SELECT t.id AS task_id, c.id, c.body AS text, c.author_id,
                u.email AS author, c.created_at
         FROM tasks t
         JOIN project_memberships m ON m.project_id = t.project_id AND m.user_id = $3
         LEFT JOIN comments c ON c.task_id = t.id
         LEFT JOIN users u ON u.id = c.author_id
         WHERE t.project_id = $1 AND t.id = $2
         ORDER BY c.created_at, c.id`,
        [projectId, taskId, userId],
      );
      if (result.rows.length === 0) {
        response.status(404).json({ error: 'Task not found' });
        return;
      }
      response.json(result.rows.filter(row => row.id !== null).map(present));
    } catch {
      response.status(500).json({ error: 'Could not load comments' });
    }
  });

  router.post('/', async (request, response) => {
    const { projectId, taskId } = request.params as Record<string, string>;
    const userId = getAuthenticatedUserId(request, response);
    if (!validId(projectId) || !validId(taskId) || !validId(userId)) {
      response.status(404).json({ error: 'Task not found' });
      return;
    }
    const text: unknown = request.body?.text;
    if (typeof text !== 'string' || text.trim().length === 0) {
      response.status(400).json({ error: 'Comment text is required' });
      return;
    }
    try {
      // INSERT ... SELECT makes both task/project scope and present membership
      // conditions of the write; the caller cannot supply author or timestamp.
      const result = await db.query<CommentRow>(
        `WITH inserted AS (
           INSERT INTO comments (task_id, author_id, body)
           SELECT t.id, $3, $4
           FROM tasks t
           JOIN project_memberships m ON m.project_id = t.project_id AND m.user_id = $3
           WHERE t.project_id = $1 AND t.id = $2
           RETURNING id, body, author_id, created_at
         )
         SELECT i.id, i.body AS text, i.author_id, u.email AS author, i.created_at
         FROM inserted i JOIN users u ON u.id = i.author_id`,
        [projectId, taskId, userId, text],
      );
      if (result.rowCount !== 1) {
        response.status(404).json({ error: 'Task not found' });
        return;
      }
      response.status(201).json(present(result.rows[0]));
    } catch {
      response.status(500).json({ error: 'Could not save comment' });
    }
  });

  return router;
}
