import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { UnheadProvider } from "@unhead/react/client";
import { head } from "@/lib/head";
import "@/i18n"; // Import i18n configuration
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UnheadProvider head={head}>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          }
        >
          <App />
        </Suspense>
      </BrowserRouter>
    </UnheadProvider>
  </StrictMode>
);
