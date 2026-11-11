export const TASK_STATUSES = ['To do', 'In progress', 'Done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const statusToDatabase: Record<TaskStatus, string> = {
  'To do': 'todo', 'In progress': 'in_progress', Done: 'done',
};
export const statusFromDatabase: Record<string, TaskStatus> = {
  todo: 'To do', in_progress: 'In progress', done: 'Done',
};

export type TaskChanges = {
  title?: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string | null;
  assigneeId?: string | null;
};

export class TaskInputError extends Error {}

export function positiveId(value: unknown): string | null {
  const text = typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : value;
  return typeof text === 'string' && /^[1-9]\d*$/.test(text) && BigInt(text) <= 9223372036854775807n ? text : null;
}

/** Calendar date only: never parse a local timestamp or normalize a rollover. */
export function calendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const lengths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= lengths[month - 1];
}

export function parseTaskChanges(body: unknown, create = false): TaskChanges {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) throw new TaskInputError('Task fields must be an object');
  const input = body as Record<string, unknown>;
  const permitted = ['title', 'description', 'status', 'dueDate', 'assigneeId'];
  if (!Object.keys(input).length || Object.keys(input).some(key => !permitted.includes(key))) throw new TaskInputError('Unknown or missing task fields');
  const result: TaskChanges = {};
  if ('title' in input) {
    if (typeof input.title !== 'string' || !input.title.trim()) throw new TaskInputError('Title is required');
    result.title = input.title.trim();
  } else if (create) throw new TaskInputError('Title is required');
  if ('description' in input) {
    if (typeof input.description !== 'string') throw new TaskInputError('Description must be text');
    result.description = input.description;
  }
  if ('status' in input) {
    if (!TASK_STATUSES.includes(input.status as TaskStatus) || (create && input.status !== 'To do')) throw new TaskInputError('Invalid status');
    result.status = input.status as TaskStatus;
  }
  if ('dueDate' in input) {
    if (input.dueDate !== null && !calendarDate(input.dueDate)) throw new TaskInputError('Invalid due date');
    result.dueDate = input.dueDate as string | null;
  }
  if ('assigneeId' in input) {
    if (input.assigneeId !== null && !positiveId(input.assigneeId)) throw new TaskInputError('Invalid assignee');
    result.assigneeId = input.assigneeId === null ? null : positiveId(input.assigneeId);
  }
  return result;
}
