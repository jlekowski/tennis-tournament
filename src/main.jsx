import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/app.css";

// Note: no <StrictMode> — the first-run demo seed writes to localStorage inside
// a useState initializer, and StrictMode's dev-only double-invocation of
// initializers would run that side effect twice and drop the demo.
createRoot(document.getElementById("root")).render(<App />);
