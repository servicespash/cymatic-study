import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { ErrorBoundary } from "./components/ErrorBoundary";

import * as Sentry from "@sentry/react";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn && typeof sentryDsn === "string" && sentryDsn.startsWith("http")) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
  });
}

const router = getRouter();
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <Sentry.ErrorBoundary fallback={<p>An error occurred</p>}>
           <RouterProvider router={router} />
        </Sentry.ErrorBoundary>
      </ErrorBoundary>
    </StrictMode>,
  );
}
