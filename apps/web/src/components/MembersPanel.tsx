import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { projectApi } from '../pages/ProjectsPage';

export type Member = { id: string; email: string; joinedAt: string };
export type MembersPanelProps = { projectId: string; creatorId: string; currentUserId: string };

export default function MembersPanel({ projectId, creatorId, currentUserId }: MembersPanelProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const isCreator = currentUserId === creatorId;
  const base = `/${encodeURIComponent(projectId)}/members`;

  const reload = useCallback(async () => {
    const result = await projectApi<Member[]>(base);
    setMembers(result);
  }, [base]);

  useEffect(() => {
    let active = true;
    projectApi<Member[]>(base).then(items => { if (active) setMembers(items); })
      .catch(reason => { if (active) setError((reason as Error).message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [base]);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      await projectApi<Member>(base, { method: 'POST', body: JSON.stringify({ email: email.trim() }) });
      await reload();
      setEmail('');
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await projectApi<void>(`${base}/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await reload();
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
  }

  return <section aria-labelledby="members-title">
    <h2 id="members-title">Members</h2>
    {error && <p role="alert">{error}</p>}
    {loading ? <p>Loading members…</p> : <ul>{members.map(person => <li key={person.id}>
      {person.email}{person.id === creatorId ? ' (creator)' : ''}{' '}
      {isCreator && person.id !== creatorId &&
        <button type="button" disabled={busy} onClick={() => void remove(person.id)} aria-label={`Remove ${person.email}`}>Remove</button>}
    </li>)}</ul>}
    {isCreator && <form onSubmit={add}>
      <label htmlFor="member-email">Registered member email</label>{' '}
      <input id="member-email" type="email" required value={email} onChange={event => setEmail(event.target.value)} />{' '}
      <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Add member'}</button>
    </form>}
  </section>;
}
