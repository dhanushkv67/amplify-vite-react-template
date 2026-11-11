import { useEffect, useState } from 'react';

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
  useEffect(() => {
    let active = true;
    request(endpoint).then(rows => { if (active) setTodos(rows); }).catch(() => { if (active) setError('Todo server unavailable'); });
    return () => { active = false; };
  }, []);
  async function add(event) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) { setError('Please type a todo first'); return; }
    try {
      const created = await request(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: trimmed }) });
      setTodos(rows => [created, ...rows]); setTitle(''); setError('');
    } catch { setError('Todo server unavailable'); }
  }
  async function toggle(todo) {
    try {
      const updated = await request(`${endpoint}/${todo.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ done: !todo.done }) });
      setTodos(rows => rows.map(row => row.id === updated.id ? updated : row)); setError('');
    } catch { setError('Todo server unavailable'); }
  }
  async function remove(todo) {
    try {
      await request(`${endpoint}/${todo.id}`, { method: 'DELETE' });
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
