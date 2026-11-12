import { describe, expect, it } from "vitest";
import { renderTodoApp } from "../renderTodoApp";
describe("AC16", () => { it("empty icon", () => { localStorage.clear(); expect(renderTodoApp().getByTestId("empty-state-icon")).toBeInTheDocument(); }); });
