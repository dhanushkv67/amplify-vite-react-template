import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithRouter } from "../test/renderWithRouter";

/**
 * AC8: Given a valid pet detail route, when the detail page renders,
 * then at least one pet photo is visible and an Adopt control is visible.
 */
describe("AC8 pet detail page", () => {
  it("shows at least one image and a visible Adopt control on a pet detail page", async () => {
    renderWithRouter("/pets/1");
    const images = await screen.findAllByRole("img");
    expect(images.length).toBeGreaterThanOrEqual(1);
    const adopt = screen.getByRole("button", { name: /adopt/i });
    expect(adopt).toBeVisible();
  });
});
