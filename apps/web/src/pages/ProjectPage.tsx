import { useEffect, useState } from 'react';
import MembersPanel from '../components/MembersPanel';
import { projectApi, type Project } from './ProjectsPage';

export type ProjectPageProps = { projectId: string; currentUserId: string };

/** The shell supplies the route parameter and the authenticated user's ID. */
export default function ProjectPage({ projectId, currentUserId }: ProjectPageProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setProject(null); setError(''); setLoading(true);
    projectApi<Project>(`/${encodeURIComponent(projectId)}`)
      .then(item => { if (active) setProject(item); })
      .catch(reason => { if (active) setError((reason as Error).message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [projectId]);

  return <main>
    <a href="/projects">Projects</a>
    {error && <p role="alert">{error}</p>}
    {loading ? <p>Loading project…</p> : project && <>
      <h1>{project.name}</h1>
      <MembersPanel projectId={project.id} creatorId={project.creatorId} currentUserId={currentUserId} />
      <a href={`/projects/${encodeURIComponent(project.id)}/board`}>Open board</a>
    </>}
  </main>;
}
