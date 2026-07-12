// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

import { logSsrError } from "./ssr-logger";

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown, source: string) {
  lastCapturedError = { error, at: Date.now() };
  // Log eagerly too — guarantees the stack reaches server logs even if the
  // response normalizer in server.ts never fires for this request.
  logSsrError(error, { source });
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) =>
    record((event as ErrorEvent).error ?? event, "globalThis.error"),
  );
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason, "globalThis.unhandledrejection"),
  );
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
