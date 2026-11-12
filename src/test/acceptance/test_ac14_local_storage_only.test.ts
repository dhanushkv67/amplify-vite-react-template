import { describe, expect, it } from "vitest";
import { writeTodosToStorage } from "../../storage/todoStorage";
describe("AC14", () => { it("only amplify-todos-v1", () => { localStorage.clear(); writeTodosToStorage([{id:"a",text:"x",done:false}]); expect(localStorage.getItem("amplify-todos-v1")).toBeTruthy(); expect(localStorage.length).toBe(1); }); });
