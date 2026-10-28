import { Request, Response } from "express";
import multer from "multer";
import { parseRobustCurriculum } from "../lib/curriculum-parser.js";

const upload = multer({ storage: multer.memoryStorage() });

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

    // Passcode verification
    const passcode = (req.body?.passcode || req.headers["x-admin-passcode"] || "")
      .toString()
      .trim();
    if (passcode && passcode !== "290350") {
      return res
        .status(401)
        .json({ error: "Unauthorized: Invalid structured developer password." });
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
