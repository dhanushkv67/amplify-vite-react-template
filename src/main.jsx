import { createRoot } from "react-dom/client";
import Cart from "./Cart.jsx";
import Todos from "./Todos.jsx";
createRoot(document.getElementById("root")).render(<><Cart items={[{ name: "pen", price: 2 }]} /><Todos /></>);
