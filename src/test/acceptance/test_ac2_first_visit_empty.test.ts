import { describe, expect, it } from "vitest";
import { readTodosFromStorage } from "../../storage/todoStorage";
describe("AC2", () => { it("zero todos initially", () => { localStorage.clear(); expect(readTodosFromStorage()).toEqual([]); }); });
