import { useCallback, useState } from "react";
import type { TodoItem } from "../types/TodoItem";
import { readTodosFromStorage, writeTodosToStorage } from "../storage/todoStorage";

export function useTodos() {
  const [todos, setTodos] = useState<TodoItem[]>(() => readTodosFromStorage());

  const addTodo = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos((prev) => {
      const next: TodoItem[] = [
        ...prev,
        { id: crypto.randomUUID(), text: trimmed, done: false },
      ];
      writeTodosToStorage(next);
      return next;
    });
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t,
      );
      writeTodosToStorage(next);
      return next;
    });
  }, []);

  const updateTodo = useCallback((id: string, text: string) => {
    setTodos((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, text } : t));
      writeTodosToStorage(next);
      return next;
    });
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const next = prev.filter((t) => t.id !== id);
      writeTodosToStorage(next);
      return next;
    });
  }, []);

  return { todos, addTodo, toggleTodo, updateTodo, deleteTodo };
}
