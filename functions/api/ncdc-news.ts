import { handleNcdcNewsRequest } from "../../src/server/ncdc-news";

export async function onRequest(context: any) {
  if (context.env) {
    for (const key in context.env) {
      process.env[key] = context.env[key];
    }
  }

  return handleNcdcNewsRequest(context.request);
}
