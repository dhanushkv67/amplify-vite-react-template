import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useTodos } from "../../hooks/useTodos";
describe("AC5", () => { it("whitespace no-op", () => { const { result } = renderHook(() => useTodos()); act(() => result.current.addTodo("   ")); expect(result.current.todos).toHaveLength(0); }); });
