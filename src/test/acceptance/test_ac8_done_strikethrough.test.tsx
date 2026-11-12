import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderTodoApp } from "../renderTodoApp";
describe("AC8", () => { it("strikethrough when done", async () => { const u = userEvent.setup(); const s = renderTodoApp(); await u.type(s.getByTestId("todo-input"), "Done item"); await u.click(s.getByTestId("todo-submit")); await u.click(s.getByTestId("todo-checkbox")); expect(s.getByText("Done item")).toHaveClass("todo-text--done"); }); });
