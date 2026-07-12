// Structured server-side error logger for SSR rendering failures.
// Prints a clearly tagged block with name, message, stack, cause, and any
// module-resolution hints — so the real failure is easy to find in worker
// or dev-server logs instead of buried under h3's generic HTTPError payload.

interface LogContext {
  source?: string;
  url?: string;
  method?: string;
}

function extractModuleResolutionHint(message: string): string | undefined {
  // Common shapes:
  //  - Cannot find module 'X' imported from '/path/Y'
  //  - Failed to resolve import "X" from "Y"
  //  - Cannot find package 'X' imported from '/path/Y'
  const patterns = [
    /Cannot find (?:module|package) ['"]([^'"]+)['"](?: imported from ['"]([^'"]+)['"])?/i,
    /Failed to resolve import ['"]([^'"]+)['"](?: from ['"]([^'"]+)['"])?/i,
    /Module not found:?\s+['"]?([^'"\s]+)['"]?/i,
  ];
  for (const re of patterns) {
    const m = message.match(re);
    if (m) {
      const mod = m[1];
      const from = m[2];
      const where = from ? ` (imported from ${from})` : "";
      return `Missing module: "${mod}"${where} — run \`bun add ${mod}\` or create the file.`;
    }
  }
  return undefined;
}

function describe(error: unknown): {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: (error as Error & { cause?: unknown }).cause,
    };
  }
  if (error && typeof error === "object") {
    const o = error as Record<string, unknown>;
    return {
      name: typeof o.name === "string" ? o.name : "NonError",
      message: typeof o.message === "string" ? o.message : safeJson(error),
      stack: typeof o.stack === "string" ? o.stack : undefined,
      cause: o.cause,
    };
  }
  return { name: "NonError", message: String(error) };
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function logSsrError(error: unknown, context: LogContext = {}): void {
  const { name, message, stack, cause } = describe(error);
  const hint = extractModuleResolutionHint(message);

  const lines: string[] = [];
  lines.push("════════════════════════════════════════════════════════════");
  lines.push(`[SSR ERROR] ${name}: ${message}`);
  if (context.source) lines.push(`  source : ${context.source}`);
  if (context.method || context.url) {
    lines.push(`  request: ${context.method ?? "GET"} ${context.url ?? "(unknown url)"}`);
  }
  if (hint) lines.push(`  hint   : ${hint}`);
  if (cause !== undefined) {
    const c = describe(cause);
    lines.push(`  cause  : ${c.name}: ${c.message}`);
    if (c.stack) lines.push(c.stack);
  }
  if (stack) lines.push(stack);
  lines.push("════════════════════════════════════════════════════════════");

  // Single console.error call keeps the block contiguous in log aggregators.
  console.error(lines.join("\n"));
}
