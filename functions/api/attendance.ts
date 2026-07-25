import { handleAttendanceRequest } from "../../src/server/attendance";

export async function onRequest(context: any) {
  if (context.env) {
    for (const key in context.env) {
      process.env[key] = context.env[key];
    }
  }

  return handleAttendanceRequest(context.request);
}
