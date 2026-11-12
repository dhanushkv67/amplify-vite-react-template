import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderTodoApp } from "../renderTodoApp";
describe("AC10", () => { it("no strike when open", async () => { const u = userEvent.setup(); const s = renderTodoApp(); await u.type(s.getByTestId("todo-input"), "Open"); await u.click(s.getByTestId("todo-submit")); expect(s.getByText("Open")).not.toHaveClass("todo-text--done"); }); });
