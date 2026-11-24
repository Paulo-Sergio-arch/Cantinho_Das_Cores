import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/design-system.css";
import "./styles/jogos.css";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
