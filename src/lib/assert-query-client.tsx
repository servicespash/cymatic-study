import { useContext } from "react";
import { QueryClientContext } from "@tanstack/react-query";

/**
 * Runtime assertion that a <QueryClientProvider> exists above this component.
 *
 * React's built-in error for a missing provider ("No QueryClient set, use
 * QueryClientProvider to set one") is thrown lazily, only when something
 * actually calls `useQuery`/`useMutation`. That makes provider regressions hard
 * to diagnose because the stack points at an arbitrary leaf component.
 *
 * Mounting <AssertQueryClient /> directly under the intended provider gives us
 * a deterministic, early failure with an actionable message and a clear
 * console.error — before any child renders or fires a query.
 */
export function AssertQueryClient(): null {
  const client = useContext(QueryClientContext);
  if (!client) {
    const message =
      "[AssertQueryClient] No QueryClient found in React context. " +
      "Wrap the app in <QueryClientProvider client={queryClient}> in src/routes/__root.tsx " +
      "(it must be an ancestor of <Outlet /> and every component that calls useQuery/useMutation).";
    // Log the raw message so it survives SSR log capture with a real stack.
    console.error(new Error(message));
    if (import.meta.env.DEV) {
      // Hard-fail in dev so the regression is impossible to miss.
      throw new Error(message);
    }
  }
  return null;
}
