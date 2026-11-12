import { useState } from "react";
import type { TodoItem } from "../types/TodoItem";
export function useTodos() {
  const [todos] = useState<TodoItem[]>([]);
  return { todos, addTodo: () => {}, toggleTodo: () => {}, updateTodo: () => {}, deleteTodo: () => {} };
}
