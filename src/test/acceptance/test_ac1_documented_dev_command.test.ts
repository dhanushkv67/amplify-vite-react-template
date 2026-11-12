import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
describe("AC1", () => { it("documents npm run dev", () => { expect(readFileSync("README.md","utf8")).toMatch(/npm run dev/i); expect(JSON.parse(readFileSync("package.json","utf8")).scripts.dev).toBeDefined(); }); });
