import type { TodoItem } from "../types/TodoItem";
const KEY = "amplify-todos-v1";
export function readTodosFromStorage(): TodoItem[] {
  const raw = globalThis.localStorage?.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TodoItem[];
  } catch {
    return [];
  }
}
export function writeTodosToStorage(items: TodoItem[]): void {
  globalThis.localStorage.setItem(KEY, JSON.stringify(items));
}
