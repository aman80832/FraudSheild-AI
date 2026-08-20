import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "../figma-ui/index.css";
import "./theme.css";

import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import GlobalLanguageApplier from "./context/GlobalLanguageApplier.jsx";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    'FraudShield: <div id="root"></div> was not found in index.html.'
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <GlobalLanguageApplier />
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>
);