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
    <main>
      <form onSubmit={handleSubmit}>
        <input
          data-testid="todo-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" data-testid="todo-submit">
          Add
        </button>
      </form>
      <ul data-testid="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} data-testid="todo-item" className="todo-item" style={{ padding: "8px 12px" }}>
            <input
              type="checkbox"
              data-testid="todo-checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            {editingId === todo.id ? (
              <>
                <input
                  data-testid="todo-edit-input"
                  type="text"
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
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
                >
                  Edit
                </button>
                <button
                  type="button"
                  data-testid="todo-delete"
                  onClick={() => deleteTodo(todo.id)}
                >
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
