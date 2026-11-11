import { useCallback, useEffect, useState } from 'react';
import TaskForm, { type Member, type Task, type TaskPayload, type TaskStatus } from '../components/TaskForm';
import TaskDetail from '../components/TaskDetail';
import '../styles/board.css';

const columns: TaskStatus[] = ['To do', 'In progress', 'Done'];
async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}
function directTaskId(projectId: string) {
  const match = window.location.pathname.match(/^\/projects\/([^/]+)\/tasks\/([^/]+)\/?$/);
  return match && decodeURIComponent(match[1]) === projectId ? decodeURIComponent(match[2]) : null;
}
/** The hosting app passes the authorized project id from its project route.
 * Standalone direct links: /projects/:projectId/tasks/:taskId. Mount this page
 * for both the board and task-detail URL; no private state is stored in links.
 */
export default function BoardPage({ projectId }: { projectId?: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<string | null>(() => projectId ? directTaskId(projectId) : null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [memberError, setMemberError] = useState('');
  const endpoint = projectId ? `/api/projects/${encodeURIComponent(projectId)}` : '';
  const reload = useCallback(async (signal?: AbortSignal) => {
    if (!projectId) return;
    setBusy(true); setError('');
    try {
      const data = await readJson<Task[]>(await fetch(`${endpoint}/tasks`, { credentials: 'include', signal }));
      if (!signal?.aborted) setTasks(data);
    } catch (failure) { if (!signal?.aborted) setError(failure instanceof Error ? failure.message : 'Could not load board'); }
    finally { if (!signal?.aborted) setBusy(false); }
  }, [endpoint, projectId]);
  useEffect(() => {
    if (!projectId) return;
    const controller = new AbortController();
    void reload(controller.signal);
    fetch(`${endpoint}/members`, { credentials: 'include', signal: controller.signal })
      .then(readJson<Member[]>).then(data => { if (!controller.signal.aborted) setMembers(data); })
      .catch(failure => { if (!controller.signal.aborted) setMemberError(failure instanceof Error ? failure.message : 'Could not load members'); });
    return () => controller.abort();
  }, [projectId, endpoint, reload]);
  useEffect(() => {
    function navigation() { setSelected(projectId ? directTaskId(projectId) : null); }
    window.addEventListener('popstate', navigation);
    navigation();
    return () => window.removeEventListener('popstate', navigation);
  }, [projectId]);
  function openTask(id: string | null) {
    if (projectId) window.history.pushState({}, '', id ? `/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(id)}` : `/projects/${encodeURIComponent(projectId)}/board`);
    setSelected(id);
  }
  async function create(payload: TaskPayload) {
    const created = await readJson<Task>(await fetch(`${endpoint}/tasks`, { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
    setCreating(false);
    await reload();
    openTask(created.id);
  }
  return <main className="board-page">
    <header className="board-header"><h1>Project board</h1>
      {projectId && <div className="board-controls"><button type="button" onClick={() => void reload()} disabled={busy}>Refresh board</button>
        <button type="button" onClick={() => setCreating(true)} disabled={!!memberError}>New task</button></div>}</header>
    {!projectId && <p role="alert">Choose a project to view its board.</p>}
    {error && <p role="alert" className="board-error">{error}</p>}
    {memberError && <p role="alert" className="board-error">Could not load members: {memberError}</p>}
    {busy && <p role="status">Loading board…</p>}
    {creating && projectId && <section aria-label="Create task"><h2>New task</h2>
      <TaskForm members={members} onSave={create} onCancel={() => setCreating(false)} /></section>}
    {selected && projectId && <TaskDetail projectId={projectId} taskId={selected} members={members}
      onBack={() => openTask(null)} onChange={() => void reload()} />}
    <div className="board-columns">{columns.map(column => <section className="board-column" key={column} aria-label={`${column} tasks`}>
      <h2>{column}</h2><ul>{tasks.filter(task => task.status === column).map(task => <li key={task.id}>
        <article className="board-card"><h3><a href={`/projects/${encodeURIComponent(projectId ?? '')}/tasks/${encodeURIComponent(task.id)}`}
          onClick={event => { event.preventDefault(); openTask(task.id); }}>{task.title}</a></h3>
          <p>Assignee: {task.assigneeEmail || 'Unassigned'}</p><p>Due: {task.dueDate || 'No date'}</p></article>
      </li>)}</ul></section>)}</div>
  </main>;
}
