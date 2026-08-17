import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "../figma-ui/index.css";
import App from "./App.jsx";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    'FraudShield: <div id="root"></div> was not found in index.html.'
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);