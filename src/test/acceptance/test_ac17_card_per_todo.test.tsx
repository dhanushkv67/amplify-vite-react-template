import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderTodoApp } from "../renderTodoApp";
describe("AC17", () => { it("card per todo", async () => { const u = userEvent.setup(); const s = renderTodoApp(); await u.type(s.getByTestId("todo-input"), "Carded"); await u.click(s.getByTestId("todo-submit")); expect(s.getAllByTestId("todo-item").length).toBe(1); }); });
