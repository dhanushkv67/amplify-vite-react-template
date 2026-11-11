import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { readFileSync } from "node:fs";
import Cart from "./Cart.jsx";

// These are black-box shopper tests. Product rows and cart rows are located by
// their visible names, not by implementation state or private storage keys.
const products = [
  ["Pen", 2], ["Notebook", 5], ["Book", 10],
  ["Backpack", 35], ["Water bottle", 12], ["Headphones", 49],
];
const mount = () => render(<Cart />);
const search = () => screen.getByRole("searchbox", { name: /search/i });
const catalog = () => screen.getByRole("region", { name: /catalog|products/i });
const cart = () => screen.getByRole("region", { name: /cart/i });
const productRow = (name) => within(catalog()).getByText(name, { exact: true }).closest("li, article, [role='listitem']");
const cartRow = (name) => within(cart()).getByText(name, { exact: true }).closest("li, article, [role='listitem']");
const add = (name) => fireEvent.click(within(productRow(name)).getByRole("button", { name: /add to cart/i }));
const quantity = (name, n) => expect(cartRow(name)).toHaveTextContent(new RegExp(`(?:quantity|qty)\\s*:?\\s*${n}\\b`, "i"));
const total = (n) => expect(within(cart()).getByText(new RegExp(`total\\s*:?\\s*\\$${n}(?!\\d)`, "i"))).toBeInTheDocument();
const adjust = (name, label) => fireEvent.click(within(cartRow(name)).getByRole("button", { name: label }));
const reload = () => { cleanup(); mount(); };

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test("test_ac1_exact_six_catalog_products_prices_and_add_buttons", () => {
  mount();
  expect(within(catalog()).getAllByRole("button", { name: /add to cart/i })).toHaveLength(6);
  for (const [name, price] of products) {
    expect(productRow(name)).toHaveTextContent(new RegExp(`\\$${price}(?!\\d)`));
    expect(within(productRow(name)).getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  }
});

test("test_ac2_live_case_insensitive_substring_search", () => {
  mount();
  fireEvent.change(search(), { target: { value: "BOOK" } });
  expect(productRow("Notebook")).toBeInTheDocument();
  expect(productRow("Book")).toBeInTheDocument();
  for (const [name] of products.filter(([name]) => !/book/i.test(name)))
    expect(within(catalog()).queryByText(name, { exact: true })).not.toBeInTheDocument();
});

test("test_ac3_empty_search_and_no_results", () => {
  mount();
  for (const [name] of products) expect(productRow(name)).toBeInTheDocument();
  fireEvent.change(search(), { target: { value: "impossible-product" } });
  expect(within(catalog()).getByText("No products match")).toBeInTheDocument();
  expect(within(catalog()).queryAllByRole("button", { name: /add to cart/i })).toHaveLength(0);
  fireEvent.change(search(), { target: { value: "" } });
  for (const [name] of products) expect(productRow(name)).toBeInTheDocument();
});

test("test_ac4_repeated_add_aggregates_and_search_does_not_clear_cart", () => {
  mount(); add("Pen"); add("Pen");
  quantity("Pen", 2);
  expect(within(cart()).getAllByText("Pen", { exact: true })).toHaveLength(1);
  fireEvent.change(search(), { target: { value: "no-match" } });
  quantity("Pen", 2);
});

test("test_ac5_fresh_browser_cart_is_empty_and_total_zero", () => {
  mount(); total(0);
  expect(within(cart()).queryByText("Pen", { exact: true })).not.toBeInTheDocument();
});

test("test_ac6_cart_rows_show_unit_price_quantity_and_distinct_products", () => {
  mount(); add("Pen"); add("Pen"); add("Book");
  expect(cartRow("Pen")).toHaveTextContent(/\$2(?!\d)/);
  quantity("Pen", 2);
  expect(cartRow("Book")).toHaveTextContent(/\$10(?!\d)/);
  quantity("Book", 1);
  expect(within(cart()).getAllByText("Pen", { exact: true })).toHaveLength(1);
});

test("test_ac7_plus_minus_removal_floor_and_readd", () => {
  mount(); add("Pen");
  adjust("Pen", /\+|increase/i); quantity("Pen", 2);
  adjust("Pen", /-|decrease/i); quantity("Pen", 1);
  adjust("Pen", /-|decrease/i);
  expect(within(cart()).queryByText("Pen", { exact: true })).not.toBeInTheDocument();
  add("Pen"); quantity("Pen", 1);
});

test("test_ac8_total_recalculates_after_each_quantity_change", () => {
  mount(); total(0); add("Pen"); total(2); add("Pen"); total(4);
  add("Book"); total(14);
  adjust("Book", /\+|increase/i); total(24);
  adjust("Pen", /-|decrease/i); total(22);
  adjust("Pen", /-|decrease/i); total(20);
  adjust("Book", /-|decrease/i); total(10);
  adjust("Book", /-|decrease/i); total(0);
});

test("test_ac9_reloading_restores_known_items_quantities_and_total", () => {
  mount(); add("Pen"); add("Pen"); add("Book"); reload();
  quantity("Pen", 2); quantity("Book", 1); total(14);
});

test("test_ac10_every_mutation_persists_and_search_does_not_change_saved_cart", () => {
  mount(); add("Pen"); reload(); quantity("Pen", 1);
  adjust("Pen", /\+|increase/i); reload(); quantity("Pen", 2);
  fireEvent.change(search(), { target: { value: "no-match" } }); reload(); quantity("Pen", 2);
  adjust("Pen", /-|decrease/i); reload(); quantity("Pen", 1);
  adjust("Pen", /-|decrease/i); reload(); total(0);
  expect(within(cart()).queryByText("Pen", { exact: true })).not.toBeInTheDocument();
});

// Seed storage via a real shopper action so these tests do not assume a private key.
const storageKey = () => {
  mount(); add("Pen");
  const key = Object.keys(localStorage).find((name) => name.toLowerCase().includes("cart"));
  expect(key).toBeDefined();
  cleanup(); return key;
};

test("test_ac11_mixed_saved_entries_retain_only_known_positive_whole_quantities", () => {
  const key = storageKey();
  const saved = JSON.parse(localStorage.getItem(key));
  // Start from a real persisted entry, so each invalid entry passes the
  // storage-shape check and actually exercises id/quantity validation.
  expect(Array.isArray(saved)).toBe(true);
  const pen = saved.find((entry) => entry.quantity === 1);
  expect(pen?.id).toBeDefined();
  const invalid = [
    { ...pen, id: "unknown-product-id", quantity: 4 },
    { ...pen, quantity: -1 },
    { ...pen, quantity: 1.5 },
  ];
  localStorage.setItem(key, JSON.stringify([pen, ...invalid]));
  mount(); quantity("Pen", 1); total(2);
  expect(within(cart()).getAllByText("Pen", { exact: true })).toHaveLength(1);
});

test("test_ac12_unreadable_saved_cart_recovers_to_empty", () => {
  const key = storageKey(); localStorage.setItem(key, "{unparseable-json");
  mount(); total(0);
  expect(within(cart()).queryByText("Pen", { exact: true })).not.toBeInTheDocument();
});

test("test_ac13_fixed_catalog_no_new_dependencies_or_remote_product_data", () => {
  const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  expect(manifest.dependencies).toEqual({ react: "18.3.1", "react-dom": "18.3.1" });
  expect(Object.keys(manifest.devDependencies).sort()).toEqual([
    "@vitejs/plugin-react", "@testing-library/dom", "@testing-library/jest-dom",
    "@testing-library/react", "@types/react", "jsdom", "vite", "vitest",
  ].sort());
  mount();
  expect(within(catalog()).getAllByRole("button", { name: /add to cart/i })).toHaveLength(6);
  for (const [name] of products) expect(productRow(name)).toBeInTheDocument();
  // A rendered fixed catalog and unchanged manifest do not prove absence of
  // network calls; that part requires review of the eventual implementation.
});

test("test_ac14_shop_behaviors_execute_in_existing_vitest_runner", () => {
  mount(); add("Pen"); quantity("Pen", 1); total(2);
  const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  expect(manifest.scripts.test).toBe("vitest run");
});
