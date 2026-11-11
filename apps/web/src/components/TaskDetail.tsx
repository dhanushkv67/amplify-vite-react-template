import { useEffect, useState } from 'react';
import TaskForm, { type Member, type Task, type TaskPayload } from './TaskForm';

type Props = { projectId: string; taskId: string; members: Member[]; onChange?: (task: Task) => void; onBack?: () => void };
const base = (projectId: string, taskId: string) => `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`;
async function json(response: Response): Promise<Task> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return response.json() as Promise<Task>;
}
export default function TaskDetail({ projectId, taskId, members, onChange, onBack }: Props) {
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setTask(null); setError(''); setEditing(false);
    fetch(base(projectId, taskId), { credentials: 'include', signal: controller.signal })
      .then(json).then(setTask).catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Could not open task'); });
    return () => controller.abort();
  }, [projectId, taskId]);
  async function save(payload: TaskPayload) {
    const updated = await json(await fetch(base(projectId, taskId), { method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
    setTask(updated); onChange?.(updated); setEditing(false);
  }
  if (error) return <section className="task-detail"><p role="alert" className="board-error">{error}</p>
    {onBack && <button type="button" onClick={onBack}>Back to board</button>}</section>;
  if (!task) return <p role="status">Loading task…</p>;
  return <section className="task-detail" aria-label="Task details">
    {onBack && <button type="button" onClick={onBack}>Back to board</button>}
    <h2>{task.title}</h2><p>{task.description || 'No description'}</p>
    <dl><dt>Status</dt><dd>{task.status}</dd><dt>Assignee</dt><dd>{task.assigneeEmail || 'Unassigned'}</dd>
      <dt>Due date</dt><dd>{task.dueDate || 'None'}</dd></dl>
    {editing ? <TaskForm key={task.id + task.status + task.title} task={task} members={members} onSave={save} onCancel={() => setEditing(false)} />
      : <button type="button" onClick={() => setEditing(true)}>Edit task</button>}
  </section>;
}
