import { describe, expect, it } from "vitest";
import { readTodosFromStorage, writeTodosToStorage } from "../../storage/todoStorage";
describe("AC13", () => { it("persists reload", () => { localStorage.clear(); writeTodosToStorage([{id:"1",text:"Stay",done:true}]); expect(readTodosFromStorage()).toEqual([{id:"1",text:"Stay",done:true}]); }); });
