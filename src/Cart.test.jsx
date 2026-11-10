import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import Cart from "./Cart.jsx";

const items = [{ name: "pen", price: 2 }, { name: "book", price: 10 }];

test("shows the total", () => {
  render(<Cart items={items} />);
  expect(screen.getByText("Total: $12")).toBeInTheDocument();
});

test("opens and closes the list", () => {
  render(<Cart items={items} />);
  expect(screen.queryByText("pen: $2")).toBeNull();
  fireEvent.click(screen.getByText("Show cart"));
  expect(screen.getByText("pen: $2")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Hide cart"));
  expect(screen.queryByText("pen: $2")).toBeNull();
});

test("test_ac1_clear_button_is_below_total_when_collapsed_or_expanded", () => {
  render(<Cart items={items} />);
  const total = screen.getByText("Total: $12");
  const clear = screen.getByRole("button", { name: "Clear cart" });
  expect(total.nextElementSibling).toBe(clear);
  expect(screen.queryByText("pen: $2")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show cart" }));
  expect(screen.getByText("pen: $2")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Clear cart" })).toBe(clear);
  expect(total.nextElementSibling).toBe(clear);
});

test("test_ac2_one_click_clears_all_items_and_total_without_mutating_input", () => {
  const supplied = Object.freeze([
    Object.freeze({ name: "pen", price: 2 }),
    Object.freeze({ name: "book", price: 10 }),
  ]);
  render(<Cart items={supplied} />);
  fireEvent.click(screen.getByRole("button", { name: "Show cart" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "Clear cart" }));
  expect(screen.getByText("Total: $0")).toBeInTheDocument();
  expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  expect(screen.queryByText("pen: $2")).not.toBeInTheDocument();
  expect(screen.queryByText("book: $10")).not.toBeInTheDocument();
  expect(supplied).toEqual([{ name: "pen", price: 2 }, { name: "book", price: 10 }]);
});

test("test_ac3_empty_state_is_immediate_initially_and_after_clearing_open_or_closed", () => {
  const assertEmpty = () => {
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(screen.getByText("Total: $0")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear cart" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^(Show|Hide) cart$/ })).not.toBeInTheDocument();
  };
  const initial = render(<Cart items={[]} />);
  assertEmpty();
  initial.unmount();

  const collapsed = render(<Cart items={items} />);
  fireEvent.click(screen.getByRole("button", { name: "Clear cart" }));
  assertEmpty();
  collapsed.unmount();

  render(<Cart items={items} />);
  fireEvent.click(screen.getByRole("button", { name: "Show cart" }));
  fireEvent.click(screen.getByRole("button", { name: "Clear cart" }));
  assertEmpty();
});

test("test_ac4_nonempty_toggle_preserves_list_and_total_until_cleared", () => {
  render(<Cart items={items} />);
  expect(screen.getByText("Total: $12")).toBeInTheDocument();
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show cart" }));
  expect(screen.getByRole("button", { name: "Hide cart" })).toBeInTheDocument();
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByText("Total: $12")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Hide cart" }));
  expect(screen.getByRole("button", { name: "Show cart" })).toBeInTheDocument();
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
  expect(screen.getByText("Total: $12")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear cart" }));
  expect(screen.getByText("Total: $0")).toBeInTheDocument();
});
