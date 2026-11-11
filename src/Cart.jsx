import { useEffect, useState } from "react";

const catalog = Object.freeze([
  { id: "pen", name: "Pen", price: 2 },
  { id: "notebook", name: "Notebook", price: 5 },
  { id: "book", name: "Book", price: 10 },
  { id: "backpack", name: "Backpack", price: 35 },
  { id: "water-bottle", name: "Water bottle", price: 12 },
  { id: "headphones", name: "Headphones", price: 49 },
]);
const storageKey = "shop-cart-v1:cart";
const knownIds = new Set(catalog.map(({ id }) => id));
// Even a full cart stays well within exact integer-dollar arithmetic.
const maxQuantity = 1000;

function readCart() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) return [];
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return [];
    const quantities = new Map();
    for (const entry of saved) {
      if (!entry || !knownIds.has(entry.id) || !Number.isSafeInteger(entry.quantity) || entry.quantity <= 0 || entry.quantity > maxQuantity) continue;
      const next = (quantities.get(entry.id) || 0) + entry.quantity;
      if (next <= maxQuantity) quantities.set(entry.id, next);
    }
    return [...quantities].map(([id, quantity]) => ({ id, quantity }));
  } catch {
    return [];
  }
}

export default function Cart() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Storage may be disabled or full; keep the cart usable in this tab.
    }
  }, [items]);

  function changeQuantity(id, delta) {
    setItems((current) => {
      const quantity = current.find((item) => item.id === id)?.quantity || 0;
      if (delta > 0 && quantity >= maxQuantity) return current;
      if (quantity === 0 && delta < 0) return current;
      if (quantity === 0) return [...current, { id, quantity: 1 }];
      if (quantity === 1 && delta < 0) return current.filter((item) => item.id !== id);
      return current.map((item) => item.id === id ? { id, quantity: quantity + delta } : item);
    });
  }

  const visibleProducts = catalog.filter(({ name }) => name.toLowerCase().includes(query.toLowerCase()));
  const cartRows = items.map(({ id, quantity }) => ({
    ...catalog.find((product) => product.id === id), quantity,
  }));
  const total = cartRows.reduce((sum, { price, quantity }) => sum + price * quantity, 0);

  return (
    <main>
      <section aria-label="Catalog">
        <h1>Catalog</h1>
        <label htmlFor="product-search">Search products</label>
        <input id="product-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
        {visibleProducts.length === 0 ? <p>No products match</p> : (
          <ul>{visibleProducts.map(({ id, name, price }) => (
            <li key={id}><span>{name}</span> — ${price} <button onClick={() => changeQuantity(id, 1)}>Add to cart</button></li>
          ))}</ul>
        )}
      </section>
      <section aria-label="Cart">
        <h2>Cart</h2>
        <ul>{cartRows.map(({ id, name, price, quantity }) => (
          <li key={id}>
            <span>{name}</span> — ${price} — Quantity: {quantity}{" "}
            <button aria-label={`Increase ${name} quantity`} onClick={() => changeQuantity(id, 1)}>+</button>{" "}
            <button aria-label={`Decrease ${name} quantity`} onClick={() => changeQuantity(id, -1)}>-</button>
          </li>
        ))}</ul>
        <p>Total: ${total}</p>
      </section>
    </main>
  );
}
