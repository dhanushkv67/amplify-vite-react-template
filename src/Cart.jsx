import { useState } from "react";
export default function Cart({ items }) {
  const [open, setOpen] = useState(false);
  const total = items.reduce((s, i) => s + i.price, 0);
  return (<div><button onClick={() => setOpen(!open)}>{open ? "Hide" : "Show"} cart</button>
    {open && <ul>{items.map(i => <li key={i.name}>{i.name}: ${i.price}</li>)}</ul>}
    <p>Total: ${total}</p></div>);
}
