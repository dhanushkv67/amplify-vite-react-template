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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; projectId: string; projectName: string; title: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
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

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearching(true); setSearchError(''); setResults([]);
    try {
      const response = await fetch(`/api/tasks/search?q=${encodeURIComponent(query.trim())}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Could not search tasks');
      setResults(await response.json() as typeof results);
    } catch (reason) { setSearchError((reason as Error).message); }
    finally { setSearching(false); }
  }

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
    <form role="search" onSubmit={search}>
      <label htmlFor="task-search">Search tasks</label>{' '}
      <input id="task-search" type="search" value={query} onChange={event => setQuery(event.target.value)} />{' '}
      <button type="submit" disabled={searching}>{searching ? 'Searching…' : 'Search'}</button>
    </form>
    {searchError && <p role="alert">{searchError}</p>}
    {results.length > 0 && <section aria-label="Task search results"><ul>{results.map(task =>
      <li key={`${task.projectId}-${task.id}`}><a href={`/projects/${encodeURIComponent(task.projectId)}/tasks/${encodeURIComponent(task.id)}`}>
        {task.title}</a> — {task.projectName}</li>)}</ul></section>}
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
