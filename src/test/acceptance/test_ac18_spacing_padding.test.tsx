import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderTodoApp } from "../renderTodoApp";
describe("AC18", () => { it("padding on card", async () => { const u = userEvent.setup(); const s = renderTodoApp(); await u.type(s.getByTestId("todo-input"), "Spaced"); await u.click(s.getByTestId("todo-submit")); const item = s.getByTestId("todo-item"); expect(parseInt(getComputedStyle(item).paddingTop || "0", 10)).toBeGreaterThanOrEqual(8); }); });
