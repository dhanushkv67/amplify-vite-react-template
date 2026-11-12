import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderTodoApp } from "../renderTodoApp";
describe("AC11", () => { it("edit text", async () => { const u = userEvent.setup(); const s = renderTodoApp(); await u.type(s.getByTestId("todo-input"), "Old"); await u.click(s.getByTestId("todo-submit")); await u.click(s.getByTestId("todo-edit")); await u.clear(s.getByTestId("todo-edit-input")); await u.type(s.getByTestId("todo-edit-input"), "New"); await u.click(s.getByTestId("todo-edit-save")); expect(s.queryByText("Old")).not.toBeInTheDocument(); expect(s.getByText("New")).toBeInTheDocument(); }); });
