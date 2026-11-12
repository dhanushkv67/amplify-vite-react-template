import { describe, expect, it } from "vitest";
import { renderTodoApp } from "../renderTodoApp";
describe("AC3", () => { it("todo list on load", () => { expect(renderTodoApp().getByTestId("todo-list")).toBeInTheDocument(); }); });
