import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../test/renderWithRouter";

/**
 * AC9: Given the pet detail page, when the user activates Adopt,
 * then the modal shows that pet's display name, a Close control,
 * and does not claim the adoption was saved on the server.
 */
describe("AC9 adopt modal", () => {
  it("shows the pet display name, Close, and no server-save claim in the modal", async () => {
    const user = userEvent.setup();
    renderWithRouter("/pets/1");
    const nameEl = await screen.findByRole("heading", { level: 1 });
    const petName = nameEl.textContent?.trim();
    expect(petName).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /adopt/i }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(petName!, { exact: false })).toBeVisible();
    expect(within(dialog).getByRole("button", { name: /close/i })).toBeVisible();
    const body = (dialog.textContent ?? "").toLowerCase();
    expect(body).not.toMatch(/saved to server|persisted|submitted to backend/);
  });
});
