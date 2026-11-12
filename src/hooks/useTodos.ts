import { useState } from "react";
import type { TodoItem } from "../types/TodoItem";

export function useTodos() {
  const [todos] = useState<TodoItem[]>([]);
  return {
    todos,
    addTodo: (_text: string) => {},
    toggleTodo: (_id: string) => {},
    updateTodo: (_id: string, _text: string) => {},
    deleteTodo: (_id: string) => {},
  };
}
