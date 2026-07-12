function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message || error.name || "Unknown error", stack: error.stack };
  }
  if (typeof error === "string") return { message: error };
  if (error && typeof error === "object") {
    try {
      return { message: JSON.stringify(error, null, 2) };
    } catch {
      return { message: String(error) };
    }
  }
  return { message: error === undefined ? "Unknown error" : String(error) };
}

export function renderErrorPage(error?: unknown): string {
  const details = error === undefined ? undefined : formatError(error);
  const detailsBlock = details
    ? `<details open><summary>Error details</summary><pre>${escapeHtml(
        details.stack ?? details.message,
      )}</pre></details>`
    : "";
  const heading = details ? escapeHtml(details.message).slice(0, 300) : "This page didn't load";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Application error</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 48rem; width: 100%; padding: 2rem; }
      h1 { font-size: 1.125rem; margin: 0 0 0.5rem; color: #b91c1c; word-break: break-word; }
      p { color: #4b5563; margin: 0 0 1.25rem; }
      .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
      details { background: #fff; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.75rem 1rem; }
      summary { cursor: pointer; font-weight: 600; }
      pre { margin: 0.75rem 0 0; padding: 0.75rem; background: #0b0f17; color: #f3f4f6; border-radius: 0.375rem; overflow: auto; max-height: 24rem; font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; word-break: break-word; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${heading}</h1>
      <p>The server hit a runtime error while rendering this page.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
      ${detailsBlock}
    </div>
  </body>
</html>`;
}
