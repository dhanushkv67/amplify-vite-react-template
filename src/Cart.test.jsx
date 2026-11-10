import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import Cart from "./Cart.jsx";
const items = [{ name: "pen", price: 2 }, { name: "book", price: 10 }];
test("shows the total", () => { render(<Cart items={items} />); expect(screen.getByText("Total: $12")).toBeInTheDocument(); });
test("opens and closes the list", () => {
  render(<Cart items={items} />);
  expect(screen.queryByText("pen: $2")).toBeNull();
  fireEvent.click(screen.getByText("Show cart"));
  expect(screen.getByText("pen: $2")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Hide cart"));
  expect(screen.queryByText("pen: $2")).toBeNull();
});
