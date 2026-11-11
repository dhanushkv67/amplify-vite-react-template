import { useState, type FormEvent } from 'react';

export type TaskStatus = 'To do' | 'In progress' | 'Done';
export type Task = {
  id: string; projectId: string; title: string; description: string; status: TaskStatus;
  assigneeId: string | null; assigneeEmail?: string | null; dueDate: string | null;
};
export type Member = { id: string; email: string };
export type TaskPayload = { title: string; description: string; dueDate: string | null; assigneeId: string | null; status?: TaskStatus };

type Props = { task?: Task; members: Member[]; onSave: (input: TaskPayload) => Promise<void>; onCancel?: () => void };
export default function TaskForm({ task, members, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'To do');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) { setError('Enter a task title.'); return; }
    setError(''); setBusy(true);
    try {
      await onSave({ title: title.trim(), description, dueDate: dueDate || null, assigneeId: assigneeId || null,
        ...(task ? { status } : {}) });
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save task. Try again.'); }
    finally { setBusy(false); }
  }
  return <form className="task-form" onSubmit={submit}>
    <label>Title <input name="title" value={title} onChange={event => setTitle(event.target.value)} required /></label>
    <label>Description <textarea name="description" value={description} onChange={event => setDescription(event.target.value)} /></label>
    <label>Due date <input name="dueDate" type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} /></label>
    <label>Assignee <select name="assigneeId" value={assigneeId} onChange={event => setAssigneeId(event.target.value)}>
      <option value="">Unassigned</option>{members.map(member => <option key={member.id} value={member.id}>{member.email}</option>)}
    </select></label>
    {task && <label>Status <select name="status" value={status} onChange={event => setStatus(event.target.value as TaskStatus)}>
      {(['To do', 'In progress', 'Done'] as const).map(value => <option key={value}>{value}</option>)}
    </select></label>}
    {error && <p role="alert" className="board-error">{error}</p>}
    <div className="task-actions"><button type="submit" disabled={busy}>{busy ? 'Saving…' : task ? 'Save changes' : 'Create task'}</button>
      {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}</div>
  </form>;
}
