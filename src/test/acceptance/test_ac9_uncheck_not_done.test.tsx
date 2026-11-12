import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderTodoApp } from "../renderTodoApp";
describe("AC9", () => { it("uncheck", async () => { const u = userEvent.setup(); const s = renderTodoApp(); await u.type(s.getByTestId("todo-input"), "Flip"); await u.click(s.getByTestId("todo-submit")); const box = s.getByTestId("todo-checkbox"); await u.click(box); await u.click(box); expect(box).not.toBeChecked(); expect(s.getByText("Flip")).toHaveAttribute("data-done","false"); }); });
