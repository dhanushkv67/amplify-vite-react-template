import { useEffect, useRef, useState } from 'react';

const endpoint = '/api/todos';
async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('Todo server unavailable');
  return response.status === 204 ? null : response.json();
}

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  // Keep successful writes ahead of an initial GET that was started earlier.
  const changes = useRef(new Map());
  const patchRequests = useRef(new Map());
  useEffect(() => {
    let active = true;
    request(endpoint).then(rows => {
      if (active) setTodos(() => {
        const loadedIds = new Set(rows.map(row => row.id));
        return [
          ...[...changes.current.values()].filter(row => row && !loadedIds.has(row.id)),
          ...rows.flatMap(row => {
            const changed = changes.current.get(row.id);
            return changed === null ? [] : [changed || row];
          }),
        ];
      });
    }).catch(() => { if (active) setError('Todo server unavailable'); });
    return () => { active = false; };
  }, []);
  async function add(event) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) { setError('Please type a todo first'); return; }
    try {
      const created = await request(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: trimmed }) });
      changes.current.set(created.id, created);
      setTodos(rows => [created, ...rows]); setTitle(''); setError('');
    } catch { setError('Todo server unavailable'); }
  }
  async function toggle(todo) {
    const sequence = (patchRequests.current.get(todo.id) || 0) + 1;
    patchRequests.current.set(todo.id, sequence);
    try {
      const updated = await request(`${endpoint}/${todo.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ done: !todo.done }) });
      if (patchRequests.current.get(todo.id) !== sequence || changes.current.get(todo.id) === null) return;
      changes.current.set(updated.id, updated);
      setTodos(rows => rows.map(row => row.id === updated.id ? updated : row)); setError('');
    } catch { setError('Todo server unavailable'); }
  }
  async function remove(todo) {
    try {
      await request(`${endpoint}/${todo.id}`, { method: 'DELETE' });
      changes.current.set(todo.id, null);
      setTodos(rows => rows.filter(row => row.id !== todo.id)); setError('');
    } catch { setError('Todo server unavailable'); }
  }
  const remaining = todos.filter(todo => !todo.done).length;
  return <section aria-label="Todos">
    <h2>Todos</h2>
    <form onSubmit={add}><label htmlFor="todo-title">Todo title</label> <input id="todo-title" value={title} onChange={event => setTitle(event.target.value)} /> <button type="submit">Add</button></form>
    {error && <p role="alert">{error}</p>}
    <ul>{todos.map(todo => <li key={todo.id}><label><input type="checkbox" checked={todo.done} onChange={() => toggle(todo)} /><span style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>{todo.title}</span></label> <button type="button" onClick={() => remove(todo)}>Delete</button></li>)}</ul>
    <p>{remaining} {remaining === 1 ? 'item' : 'items'} left</p>
  </section>;
}
