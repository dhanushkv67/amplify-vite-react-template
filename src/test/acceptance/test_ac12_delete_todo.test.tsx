import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderTodoApp } from "../renderTodoApp";
describe("AC12", () => { it("delete removes", async () => { const u = userEvent.setup(); const s = renderTodoApp(); await u.type(s.getByTestId("todo-input"), "Remove me"); await u.click(s.getByTestId("todo-submit")); await u.click(s.getByTestId("todo-delete")); expect(s.queryByText("Remove me")).not.toBeInTheDocument(); }); });
