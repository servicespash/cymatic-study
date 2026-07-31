import dotenv from "dotenv";
dotenv.config({ override: true });

// Auto-map Gemini key variations for maximum robustness
process.env.GOOGLE_GENERATIVE_AI_API_KEY =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY;

import express from "express";
import path from "path";
import { handleTutorRequest } from "./src/server/tutor";
import { handleNcdcNewsRequest } from "./src/server/ncdc-news";
import { handleDynamicNotesRequest } from "./src/server/dynamic-notes";
import { handleEmailRequest } from "./src/server/email-router";
import { handleAttendanceRequest } from "./src/server/attendance";

async function startServer() {
  console.log("[Boot] Current working directory:", process.cwd());
  console.log("[Boot] GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length || 0);
  console.log(
    "[Boot] GEMINI_API_KEY prefix:",
    process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 15) : "none",
  );

  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Helper to convert Express request to Web Request
  function toWebRequest(req: express.Request): Request {
    const protocol = req.protocol;
    const host = req.get("host");
    const url = new URL(req.originalUrl, `${protocol}://${host}`);

    const body = ["POST", "PUT", "PATCH"].includes(req.method)
      ? JSON.stringify(req.body)
      : undefined;

    return new Request(url.toString(), {
      method: req.method,
      headers: new Headers(req.headers as any),
      body,
    });
  }

  // API Routes
  app.get("/api/debug-env", (req, res) => {
    res.json({
      cwd: process.cwd(),
      keys: Object.keys(process.env).filter(
        (k) => k.includes("GEMINI") || k.includes("GOOGLE") || k.includes("API"),
      ),
      geminiLength: process.env.GEMINI_API_KEY?.length || 0,
      geminiPrefix: process.env.GEMINI_API_KEY
        ? process.env.GEMINI_API_KEY.substring(0, 15)
        : "none",
    });
  });

  app.post("/api/tutor", async (req, res) => {
    console.log(`[API] POST /api/tutor from ${req.ip}`);
    try {
      const webReq = toWebRequest(req);
      const response = await handleTutorRequest(webReq);

      // Handle streaming responses
      if (response.headers.get("Content-Type") === "text/event-stream") {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const reader = response.body?.getReader();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        }
        res.end();
      } else {
        const data = await response.json();
        res.status(response.status).json(data);
      }
    } catch (error: any) {
      console.error("Tutor API error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ncdc-news", async (req, res) => {
    console.log(`[API] POST /api/ncdc-news from ${req.ip}`);
    try {
      const webReq = toWebRequest(req);
      const response = await handleNcdcNewsRequest(webReq);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("NCDC News API error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/dynamic-notes", async (req, res) => {
    console.log(`[API] POST /api/dynamic-notes from ${req.ip}`);
    try {
      const webReq = toWebRequest(req);
      const response = await handleDynamicNotesRequest(webReq);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("Dynamic Notes API error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/send-email", async (req, res) => {
    try {
      await handleEmailRequest(req, res);
    } catch (error: any) {
      console.error("Email API error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    console.log(`[API] POST /api/attendance from ${req.ip}`);
    try {
      const webReq = toWebRequest(req);
      const response = await handleAttendanceRequest(webReq);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("Attendance API error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  const isDev =
    process.env.NODE_ENV === "development" ||
    (!process.env.NODE_ENV && process.env.DISABLE_HMR !== "true");
  console.log("[Boot] Mode:", isDev ? "development" : "production");

  if (isDev) {
    console.log("[Boot] Loading Vite in middlewareMode...");
    const { createServer } = await import("vite");
    console.log("[Boot] Importing vite succeeded. Creating server...");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    console.log("[Boot] Vite server created. Applying middlewares...");
    app.use(vite.middlewares);
    console.log("[Boot] Vite middlewares applied.");
  } else {
    console.log("[Boot] Serving production static files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  console.log("[Boot] Starting to listen on port:", PORT);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
