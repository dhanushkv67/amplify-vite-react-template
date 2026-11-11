import { useEffect, useRef, useState, type FormEvent } from 'react';

type Comment = {
  id: string;
  text: string;
  author: string;
  authorId: string;
  createdAt: string;
};

type Props = { projectId: string | number; taskId: string | number };

/** Mount inside the authorized task detail with its project/task IDs. */
export default function Comments({ projectId, taskId }: Props) {
  const url = `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/comments`;
  const currentUrl = useRef(url);
  currentUrl.current = url;
  const [loaded, setLoaded] = useState<{ url: string; comments: Comment[] }>({ url, comments: [] });
  // Never display a prior task's comments while a direct-link/task change loads.
  const comments = loaded.url === url ? loaded.comments : [];
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoaded({ url, comments: [] });
    setText('');
    setLoading(true);
    setLoadError('');
    setSaveError('');
    void (async () => {
      try {
        const response = await fetch(url, { credentials: 'same-origin', signal: controller.signal });
        if (!response.ok) throw new Error('Could not load comments');
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error('Could not load comments');
        if (!controller.signal.aborted) setLoaded({ url, comments: data as Comment[] });
      } catch {
        if (!controller.signal.aborted) setLoadError('Could not load comments. Please try again.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [url]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaveError('');
    if (!text.trim()) {
      setSaveError('Enter a comment before posting.');
      return;
    }
    const submittedUrl = url;
    const submittedText = text;
    setSaving(true);
    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: submittedText }),
      });
      if (!response.ok) throw new Error('Could not save comment');
      const comment = await response.json() as Comment;
      if (currentUrl.current === submittedUrl) {
        setLoaded(previous => ({ url, comments: [...(previous.url === url ? previous.comments : []), comment] }));
        setText('');
      }
    } catch {
      if (currentUrl.current === submittedUrl) {
        setSaveError('Could not save comment. Your text is still here; please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-label="Comments">
      <h2>Comments</h2>
      {loading && <p role="status">Loading comments…</p>}
      {loadError && <p role="alert">{loadError}</p>}
      {!loading && !loadError && comments.length === 0 && <p>No comments yet.</p>}
      <ol>
        {comments.map(comment => (
          <li key={comment.id}>
            <p>{comment.text}</p>
            <p>
              <span>{comment.author}</span>{' · '}
              <time dateTime={comment.createdAt}>{comment.createdAt}</time>
            </p>
          </li>
        ))}
      </ol>
      <form onSubmit={submit}>
        <label htmlFor="new-comment">Comment</label>
        <textarea id="new-comment" value={text} onChange={event => setText(event.target.value)} />
        {saveError && <p role="alert">{saveError}</p>}
        <button type="submit" disabled={saving || !text.trim()}>{saving ? 'Posting…' : 'Post comment'}</button>
      </form>
    </section>
  );
}
