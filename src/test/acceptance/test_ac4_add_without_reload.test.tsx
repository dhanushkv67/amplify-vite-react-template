import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderTodoApp } from "../renderTodoApp";
describe("AC4", () => { it("adds todo", async () => { const u = userEvent.setup(); const s = renderTodoApp(); await u.type(s.getByTestId("todo-input"), "Buy milk"); await u.click(s.getByTestId("todo-submit")); expect(s.getByText("Buy milk")).toBeInTheDocument(); }); });
