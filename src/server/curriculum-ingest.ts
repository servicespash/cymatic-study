import { Request, Response } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { parseRobustCurriculum } from "../lib/curriculum-parser.js";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://tffffvbaiccqndydsobg.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_Q6c0ZU7hu-Ow6bdzbK5-ig_S74FsIK0";

async function verifyAuthenticatedCurriculumAdmin(req: Request): Promise<boolean> {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return false;

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return false;

  const profileClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: "Bearer " + token } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile, error: profileError } = await profileClient
    .from("profiles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  const role = profileError ? "" : String(profile?.role || "").toLowerCase();
  return ["admin", "org_admin", "superadmin"].includes(role) ||
    data.user.email?.trim().toLowerCase() === "latifisabirye123@gmail.com";
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
});

export async function handleCurriculumIngestRequest(req: Request, res: Response) {
  console.log("[API] POST /api/curriculum-ingest - Robust ingestion started");

  upload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: "File upload failed: " + err.message });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No file uploaded. Please select a valid PDF or text curriculum file." });
    }

    // The browser-side developer gate is not a security boundary. Verify the
    // Supabase access token and database admin role on the server for every upload.
    const authorized = await verifyAuthenticatedCurriculumAdmin(req);
    if (!authorized) {
      return res.status(401).json({
        error: "Unauthorized: sign in with the authorised curriculum administrator account before uploading.",
      });
    }

    try {
      const originalName = req.file.originalname || "curriculum_document";
      const isPdf =
        originalName.toLowerCase().endsWith(".pdf") || req.file.mimetype === "application/pdf";

      // Use robust parser
      const parsedData = await parseRobustCurriculum(req.file.buffer, originalName, isPdf);

      console.log(
        `[API] Robust parser completed for ${originalName}: ${parsedData.subjectTitle} (${parsedData.levelLabel}) with ${parsedData.topics.length} topics.`,
      );

      return res.status(200).json({
        status: "Success",
        fileName: originalName,
        fileSize: req.file.size,
        data: parsedData,
        message: "Science curriculum notes parsed robustly using pdfjs-dist.",
      });
    } catch (error: any) {
      console.error("[API] Curriculum Ingest error:", error);
      return res.status(500).json({
        error: error.message || "Failed to process curriculum file.",
      });
    }
  });
}
