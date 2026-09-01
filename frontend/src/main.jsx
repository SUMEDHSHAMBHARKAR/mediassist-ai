import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { UIProvider } from "./context/UIContext";
import "./index.css";

/**
 * Provider order matters:
 *   BrowserRouter  — UIProvider reads the location to close the mobile drawer
 *   AuthProvider   — the shell and navigation are role-aware
 *   UIProvider     — shell UI state
 *   NotificationProvider — navbar badge and notification centre share one list
 */
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UIProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </UIProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
