import { handleDynamicNotesRequest } from "../../src/server/dynamic-notes";

export async function onRequest(context: any) {
  // Bind Cloudflare Pages environment variables to process.env if available
  if (context.env) {
    for (const key in context.env) {
      process.env[key] = context.env[key];
    }
  }

  return handleDynamicNotesRequest(context.request);
}
