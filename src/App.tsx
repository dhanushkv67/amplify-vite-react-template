import { FormEvent, useState } from "react";
import { useTodos } from "./hooks/useTodos";
import "./App.css";

export function App() {
  const { todos, addTodo, toggleTodo, updateTodo, deleteTodo } = useTodos();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    addTodo(draft);
    setDraft("");
  }

  function startEdit(id: string, text: string) {
    setEditingId(id);
    setEditDraft(text);
  }

  function saveEdit() {
    if (editingId === null) return;
    updateTodo(editingId, editDraft);
    setEditingId(null);
    setEditDraft("");
  }

  return (
    <main className="app-shell">
      <h1 className="visually-hidden">Amplify Todos</h1>
      <form className="todo-form" onSubmit={handleSubmit} aria-label="Add a todo">
        <label htmlFor="todo-new-input" className="visually-hidden">
          New todo
        </label>
        <input
          id="todo-new-input"
          data-testid="todo-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="New todo"
        />
        <button type="submit" data-testid="todo-submit">
          Add
        </button>
      </form>
      <ul data-testid="todo-list" aria-label="Todo list">
        {todos.length === 0 ? (
          <li className="empty-state" data-testid="empty-state">
            <span
              className="empty-state__icon"
              data-testid="empty-state-icon"
              aria-hidden="true"
            >
              &#128203;
            </span>
            No todos yet - add your first one
          </li>
        ) : (
          todos.map((todo) => (
            <li
              key={todo.id}
              data-testid="todo-item"
              className="todo-item"
              style={{ padding: "8px 12px" }}
            >
              <input
                type="checkbox"
                data-testid="todo-checkbox"
                checked={todo.done}
                onChange={() => toggleTodo(todo.id)}
                aria-label={`Mark "${todo.text}" done`}
              />
              {editingId === todo.id ? (
                <>
                  <label htmlFor="todo-edit-input" className="visually-hidden">
                    Edit todo text
                  </label>
                  <input
                    id="todo-edit-input"
                    data-testid="todo-edit-input"
                    type="text"
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    aria-label="Edit todo text"
                  />
                  <button
                    type="button"
                    data-testid="todo-edit-save"
                    onClick={saveEdit}
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <span
                    className={todo.done ? "todo-text--done" : undefined}
                    data-done={todo.done ? "true" : "false"}
                  >
                    {todo.text}
                  </span>
                  <button
                    type="button"
                    data-testid="todo-edit"
                    onClick={() => startEdit(todo.id, todo.text)}
                    aria-label={`Edit "${todo.text}"`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    data-testid="todo-delete"
                    onClick={() => deleteTodo(todo.id)}
                    aria-label={`Delete "${todo.text}"`}
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
