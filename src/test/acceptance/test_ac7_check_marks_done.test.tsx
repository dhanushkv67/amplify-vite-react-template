import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderTodoApp } from "../renderTodoApp";
describe("AC7", () => { it("check marks done", async () => { const u = userEvent.setup(); const s = renderTodoApp(); await u.type(s.getByTestId("todo-input"), "Task"); await u.click(s.getByTestId("todo-submit")); const box = s.getByTestId("todo-checkbox"); await u.click(box); expect(box).toBeChecked(); expect(s.getByText("Task")).toHaveAttribute("data-done","true"); }); });
