import { handleTutorRequest } from "../../src/server/tutor";

export async function onRequest(context: any) {
  // Bind Cloudflare Pages environment variables to process.env if available
  if (context.env) {
    for (const key in context.env) {
      process.env[key] = context.env[key];
    }
  }

  return handleTutorRequest(context.request);
}
