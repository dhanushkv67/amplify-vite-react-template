import { useEffect, useState, type FormEvent } from 'react';

export type Project = { id: string; name: string; creatorId: string; createdAt: string };

export async function projectApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/projects${path}`, {
    credentials: 'include',
    ...init,
    headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || `Request failed (${response.status})`);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    projectApi<Project[]>('').then(items => { if (active) setProjects(items); })
      .catch(reason => { if (active) setError(String(reason.message)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!name.trim()) { setError('Project name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const created = await projectApi<Project>('', { method: 'POST', body: JSON.stringify({ name: name.trim() }) });
      setProjects(current => [created, ...current]);
      setName('');
    } catch (reason) { setError((reason as Error).message); }
    finally { setSaving(false); }
  }

  return <main>
    <h1>Projects</h1>
    <form onSubmit={create}>
      <label htmlFor="project-name">Project name</label>{' '}
      <input id="project-name" value={name} onChange={event => setName(event.target.value)} required />{' '}
      <button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create project'}</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {loading ? <p>Loading projects…</p> : projects.length ?
      <ul>{projects.map(item => <li key={item.id}><a href={`/projects/${encodeURIComponent(item.id)}`}>{item.name}</a></li>)}</ul> :
      <p>No projects yet.</p>}
  </main>;
}
