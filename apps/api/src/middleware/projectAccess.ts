import type { Request, RequestHandler } from 'express';
import type { Pool } from 'pg';

export type ProjectDatabase = Pick<Pool, 'query' | 'connect'>;
export type UserIdFromRequest = (request: Request) => string | number | null | undefined;
export type ProjectAccess = { projectId: string; creatorId: string; userId: string };

/** Bigint IDs are kept as strings so they never lose precision in JavaScript. */
export function validId(value: unknown): value is string {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) &&
    (value.length < 19 || (value.length === 19 && value <= '9223372036854775807'));
}

export function createProjectAccess(db: ProjectDatabase, getUserId: UserIdFromRequest) {
  const check = (creatorOnly: boolean): RequestHandler => async (request, response, next) => {
    const projectId = request.params.projectId;
    const rawUserId = getUserId(request);
    const userId = rawUserId == null ? '' : String(rawUserId);
    if (!validId(userId)) { response.status(401).json({ error: 'Authentication required' }); return; }
    if (!validId(projectId)) { response.status(404).json({ error: 'Project not found' }); return; }
    try {
      // Never cache membership: every route, including task/comment routes, checks the current DB state.
      const result = await db.query<{ creator_id: string }>(
        `SELECT p.created_by AS creator_id FROM projects p
         JOIN project_memberships m ON m.project_id = p.id
         WHERE p.id = $1 AND m.user_id = $2`, [projectId, userId]);
      if (result.rowCount === 0) { response.status(404).json({ error: 'Project not found' }); return; }
      const creatorId = String(result.rows[0].creator_id);
      if (creatorOnly && creatorId !== userId) {
        response.status(403).json({ error: 'Only the creator can manage members' }); return;
      }
      response.locals.projectAccess = { projectId, creatorId, userId } satisfies ProjectAccess;
      next();
    } catch (error) { next(error); }
  };
  return { requireMember: check(false), requireCreator: check(true) };
}

/** Use after requireMember/requireCreator; never derive authorization from a client-supplied role. */
export function checkedProjectAccess(locals: Record<string, unknown>): ProjectAccess {
  return locals.projectAccess as ProjectAccess;
}
