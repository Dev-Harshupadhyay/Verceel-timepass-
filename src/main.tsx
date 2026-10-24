import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./state/ThemeProvider";
import { ToastProvider } from "./state/ToastProvider";
import { ConfigProvider } from "./state/ConfigProvider";
import { AuthProvider } from "./state/AuthProvider";
import { LangProvider } from "./state/LangProvider";

import "./styles/legacy.css";
import "./styles/apple.css";
import "./styles/ui.css";
import "./styles/studio.css";

const host = document.getElementById("root");
if (!host) throw new Error("#root missing");

createRoot(host).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <ConfigProvider>
          <LangProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </LangProvider>
        </ConfigProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);
