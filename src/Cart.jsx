import { useState } from "react";

export default function Cart({ items }) {
  const [cartItems, setCartItems] = useState(() => [...items]);
  const [open, setOpen] = useState(false);
  const total = cartItems.reduce((sum, item) => sum + item.price, 0);
  const isEmpty = cartItems.length === 0;

  return (
    <div>
      {!isEmpty && (
        <button onClick={() => setOpen(!open)}>
          {open ? "Hide" : "Show"} cart
        </button>
      )}
      {isEmpty ? (
        <p>Your cart is empty</p>
      ) : (
        open && <ul>{cartItems.map(item => <li key={item.name}>{item.name}: ${item.price}</li>)}</ul>
      )}
      <p>Total: ${total}</p>
      {!isEmpty && <button onClick={() => setCartItems([])}>Clear cart</button>}
    </div>
  );
}
