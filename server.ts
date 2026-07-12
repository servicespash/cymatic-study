import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { handleTutorRequest } from "./src/server/tutor";
import { handleNcdcNewsRequest } from "./src/server/ncdc-news";
import { handleDynamicNotesRequest } from "./src/server/dynamic-notes";
import { handleEmailRequest } from "./src/server/email-router";

async function startServer() {
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

    return new Request(url.toString(), {
      method: req.method,
      headers: new Headers(req.headers as any),
      body: ["POST", "PUT", "PATCH"].includes(req.method) ? JSON.stringify(req.body) : undefined,
    });
  }

  // API Routes
  app.post("/api/tutor", async (req, res) => {
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
