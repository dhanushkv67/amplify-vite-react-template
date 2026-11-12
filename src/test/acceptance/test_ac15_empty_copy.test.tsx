import { describe, expect, it } from "vitest";
import { renderTodoApp } from "../renderTodoApp";
describe("AC15", () => { it("empty copy", () => { localStorage.clear(); const s = renderTodoApp(); expect(s.getByTestId("empty-state")).toHaveTextContent("No todos yet - add your first one"); }); });
