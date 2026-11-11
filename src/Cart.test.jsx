import { beforeEach, test, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import Cart from "./Cart.jsx";

beforeEach(() => localStorage.clear());

test("a new cart has no seeded items and a zero total", () => {
  render(<Cart />);
  const cart = screen.getByRole("region", { name: "Cart" });
  expect(within(cart).getByText("Total: $0")).toBeInTheDocument();
  expect(within(cart).queryByText("Pen")).not.toBeInTheDocument();
});

test("the cart is visible without a toggle and shows added items", () => {
  render(<Cart />);
  const cart = screen.getByRole("region", { name: "Cart" });
  const catalog = screen.getByRole("region", { name: "Catalog" });
  const pen = within(catalog).getByText("Pen").closest("li");
  fireEvent.click(within(pen).getByRole("button", { name: "Add to cart" }));
  expect(within(cart).getByText("Pen")).toBeInTheDocument();
  expect(within(cart).getByText("Total: $2")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /show cart|hide cart/i })).not.toBeInTheDocument();
});
