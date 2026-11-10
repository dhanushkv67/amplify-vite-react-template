import { createRoot } from "react-dom/client";
import Cart from "./Cart.jsx";
createRoot(document.getElementById("root")).render(<Cart items={[{ name: "pen", price: 2 }]} />);
