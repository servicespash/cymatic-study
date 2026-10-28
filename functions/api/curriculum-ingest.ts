import { createClient } from "@supabase/supabase-js";
import { parseRobustCurriculum } from "../../src/lib/curriculum-parser";

type RuntimeEnv = {
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function onRequestGet() {
  return json({
    error: "Method not allowed. Upload a PDF with POST /api/curriculum-ingest.",
    method: "POST",
  }, 405);
}

export async function onRequestPost({
  request,
  env,
}: {
  request: Request;
  env: RuntimeEnv;
}) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!token) return json({ error: "Sign in as an authorised curriculum administrator before uploading." }, 401);

    const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "https://tffffvbaiccqndydsobg.supabase.co";
    const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Q6c0ZU7hu-Ow6bdzbK5-ig_S74FsIK0";
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userResult, error: authError } = await authClient.auth.getUser(token);
    if (authError || !userResult.user) return json({ error: "Your session is invalid or expired. Sign in again." }, 401);

    const user = userResult.user;
    const profileClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: "Bearer " + token } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: profile, error: profileError } = await profileClient
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    const role = profileError ? "" : String(profile?.role || "").toLowerCase();
    const allowed = ["admin", "org_admin", "superadmin"].includes(role) ||
      user.email?.trim().toLowerCase() === "latifisabirye123@gmail.com";
    if (!allowed) return json({ error: "This account is not authorised to ingest curriculum documents." }, 403);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "No file uploaded. Select a PDF or text curriculum file." }, 400);
    if (file.size === 0) return json({ error: "The selected file is empty." }, 400);
    if (file.size > 20 * 1024 * 1024) return json({ error: "File exceeds the 20 MB upload limit." }, 413);

    const filename = file.name || "curriculum_document";
    const isPdf = filename.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    const bytes = new Uint8Array(await file.arrayBuffer());
    const input = isPdf ? Buffer.from(bytes) : new TextDecoder().decode(bytes);
    const parsedData = await parseRobustCurriculum(input, filename, isPdf);
    if (!parsedData.topics?.length) return json({ error: "Text was extracted, but no reliable curriculum headings were identified. No records were saved." }, 422);

    console.log("[API] curriculum ingest parsed", {
      filename,
      bytes: file.size,
      topics: parsedData.topics.length,
      subject: parsedData.subjectTitle,
      level: parsedData.levelLabel,
    });
    return json({
      status: "Success",
      fileName: filename,
      fileSize: file.size,
      data: parsedData,
      message: "PDF text extracted and parsed for developer review. No curriculum records were published by this endpoint.",
    });
  } catch (error) {
    console.error("[API] Curriculum ingest failed", error);
    return json({
      error: error instanceof Error ? error.message : "Unexpected curriculum ingestion failure.",
    }, 500);
  }
}
