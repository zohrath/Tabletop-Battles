import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.tsx";
import { authClient } from "./lib/auth.ts";
import { NeonAuthUIProvider } from "@neondatabase/neon-js/auth/react";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {authClient ? (
      <NeonAuthUIProvider emailOTP authClient={authClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </NeonAuthUIProvider>
    ) : (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )}
  </StrictMode>,
);
