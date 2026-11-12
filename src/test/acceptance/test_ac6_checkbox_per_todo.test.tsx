import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderTodoApp } from "../renderTodoApp";
describe("AC6", () => { it("checkbox per todo", async () => { const u = userEvent.setup(); const s = renderTodoApp(); await u.type(s.getByTestId("todo-input"), "One"); await u.click(s.getByTestId("todo-submit")); expect(s.getAllByTestId("todo-checkbox").length).toBeGreaterThanOrEqual(1); }); });
